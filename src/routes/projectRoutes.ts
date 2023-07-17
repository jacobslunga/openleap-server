import { Router } from "express";

import {
  createProject,
  getProjectById,
  getProjects,
  addMemberToProject,
  deleteProject,
  removeMemberFromProject,
  updateProject,
} from "../controllers/projectController";

const router = Router();

router.get("/", getProjects);
router.get("/:id", getProjectById);

router.post("/create", createProject);
router.post("/:id/members", addMemberToProject);
router.post("/:id/members/:userId", removeMemberFromProject);
router.post("/:id/update", updateProject);

router.delete("/:id/delete", deleteProject);
