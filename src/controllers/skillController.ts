import { Request, Response } from "express";
import { prisma } from "../prismaClient";

// POST /skills/create
export const createSkill = async (req: Request, res: Response) => {
  const { name, userId } = req.body;

  const skill = await prisma.skill.create({
    data: {
      name,
      userId,
    },
  });

  res.json(skill);
};

// DELETE /skills/:id
export const deleteSkill = async (req: Request, res: Response) => {
  const { id } = req.params;

  const skill = await prisma.skill.delete({
    where: {
      id: id,
    },
  });

  res.json(skill);
};
