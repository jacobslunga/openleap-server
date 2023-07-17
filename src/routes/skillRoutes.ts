import { Router } from "express";
import { createSkill, deleteSkill } from "../controllers/skillController";

const router = Router();

router.post("/create", createSkill);
router.delete("/:id", deleteSkill);

export default router;
