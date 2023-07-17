import { Request, Response } from "express";
import { prisma } from "../prismaClient";

// GET /projects
export const getProjects = async (_: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    include: { members: true },
  });
  res.json(projects);
};

// GET /projects/:id
export const getProjectById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const project = await prisma.project.findUnique({
    where: { id: id },
    include: {
      members: true,
      tasks: true,
    },
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  res.json(project);
};

// POST /projects/create
export const createProject = async (req: Request, res: Response) => {
  const { name, description, userId } = req.body;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      members: {
        create: {
          userId,
          role: "OWNER",
          isOwner: true,
        },
      },
    },
  });

  res.json(project);
};

// POST /projects/:id/members
export const addMemberToProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, role } = req.body;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        members: {
          create: {
            userId,
            role,
            isOwner: false,
          },
        },
      },
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
};

// PUT /projects/:id
export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
};

// DELETE /projects/:id
export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.members.some(
      (member) => member.userId === userId && member.isOwner
    );

    if (!isOwner) {
      return res
        .status(403)
        .json({ message: "Only the project owner can delete the project" });
    }

    const deletedProject = await prisma.project.delete({ where: { id } });

    res.json(deletedProject);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
};

// DELETE /projects/:id/members/:userId
export const removeMemberFromProject = async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  const currentUserId = req.user?.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.members.some(
      (member) => member.userId === currentUserId && member.isOwner
    );

    if (!isOwner) {
      return res
        .status(403)
        .json({ message: "Only the project owner can remove members" });
    }

    const deletedMember = await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId: id } },
    });

    res.json(deletedMember);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
};
