import { Request, Response } from "express";
import { prisma } from "../prismaClient";
import { formatName, isValidEmail } from "../util";
import jwt from "jsonwebtoken";
import { generateJwtToken, generateRefreshToken } from "../middleware/jwt";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { User } from "../types/User";

// GET /users
export const getUsers = async (_: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

// GET /users/:id
export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: id },
    include: {
      skills: true,
      memberships: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId: id,
        },
      },
    },
    include: {
      members: true,
    },
  });

  res.json({
    ...user,
    projects,
  });
};

// GET /users/auth/me
export const getMe = async (req: Request, res: Response) => {
  const id = req.user?.id;

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId: id,
        },
      },
    },
    include: {
      members: true,
    },
  });

  res.json({
    ...user,
    projects,
  });
};

// PUT /users/update/me
export const updateMe = async (req: Request, res: Response) => {
  const id = req.user?.id;

  const { firstName, lastName, email, imageUrl, username, isPremium } =
    req.body;

  const formattedFirstName = formatName(firstName);
  const formattedLastName = formatName(lastName);

  const user = await prisma.user.update({
    where: {
      id,
    },
    data: {
      firstName: formattedFirstName,
      lastName: formattedLastName,
      fullName: `${formattedFirstName} ${formattedLastName}`,
      email,
      imageUrl,
      username,
      isPremium,
    },
  });

  res.json(user);
};

/* AUTH */

// POST /users/auth/register
export const register = async (req: Request, res: Response) => {
  const { email, password, username, confirmPassword } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }

  let user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (user) {
    return res.status(409).json({ message: "Email is already taken" });
  }

  user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (user) {
    return res.status(409).json({ message: "Username is already taken" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = (await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      username,
      authProvider: "EMAIL",
    },
  })) as User;

  const accessToken = generateJwtToken(newUser as User);
  const refreshToken = generateRefreshToken(newUser as User);
  const nowInMilliseconds = Date.now();

  const expiresAt = nowInMilliseconds + 60 * 60 * 2 * 1000;

  res.json({
    accessToken,
    refreshToken,
    expiresAt,
    name: newUser.username,
    email: newUser.email,
    id: newUser.id,
  });
};

// POST /users/auth/register/provider
export const registerWithProvider = async (req: Request, res: Response) => {
  const { email, firstName, lastName, imageUrl, authProvider, username } =
    req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (user) {
    const accessToken = generateJwtToken(user as User);
    const refreshToken = generateRefreshToken(user as User);
    const nowInMilliseconds = Date.now();

    const expiresAt = nowInMilliseconds + 60 * 60 * 2 * 1000;

    if (user.imageUrl !== imageUrl) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          imageUrl,
        },
      });
    }

    return res.json({
      accessToken,
      refreshToken,
      expiresAt,
      name: user.fullName,
      email: user.email,
      id: user.id,
    });
  } else {
    let newUser;

    switch (authProvider) {
      case "GOOGLE":
        const formattedFirstName = formatName(firstName);
        const formattedLastName = formatName(lastName);
        newUser = await prisma.user.create({
          data: {
            id: uuidv4(),
            email,
            username,
            firstName: formattedFirstName,
            lastName: formattedLastName,
            fullName: `${formattedFirstName} ${formattedLastName}`,
            imageUrl,
            password: bcrypt.hashSync(uuidv4(), 12),
            authProvider,
          },
        });
        break;
      case "GITHUB":
        newUser = await prisma.user.create({
          data: {
            id: uuidv4(),
            email,
            username,
            imageUrl,
            password: bcrypt.hashSync(uuidv4(), 12),
            authProvider,
          },
        });
        break;
      default:
        return res.status(400).json({ message: "Invalid auth provider" });
    }

    const accessToken = generateJwtToken(newUser as User);
    const refreshToken = generateRefreshToken(newUser as User);
    const nowInMilliseconds = Date.now();

    const expiresAt = nowInMilliseconds + 60 * 60 * 2 * 1000;

    res.json({
      accessToken,
      refreshToken,
      expiresAt,
      name: newUser.fullName ?? newUser.username,
      email: newUser.email,
      id: newUser.id,
    });
  }
};

// POST /users/auth/login
export const login = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!isValidEmail(email) && !username) {
    return res.status(400).json({ message: "Invalid email" });
  }

  let user;

  user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = generateJwtToken(user as User);
  const refreshToken = generateRefreshToken(user as User);
  const nowInMilliseconds = Date.now();

  const expiresAt = nowInMilliseconds + 60 * 60 * 2 * 1000;

  res.json({
    accessToken,
    refreshToken,
    expiresAt,
    name: user.username,
    email: user.email,
    id: user.id,
  });
};

// POST /users/auth/refresh-token
export const refreshToken = (req: Request, res: Response) => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET as string;
  const refreshHeader = req.headers["x-refresh"];

  if (!refreshHeader) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const user = jwt.verify(refreshHeader as string, refreshSecret) as User;
    const accessToken = generateJwtToken(user);
    const refreshToken = generateRefreshToken(user);
    const nowInMilliseconds = Date.now();

    const expiresAt = nowInMilliseconds + 60 * 60 * 2 * 1000;

    res.status(200).json({
      accessToken,
      refreshToken,
      expiresAt,
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};
