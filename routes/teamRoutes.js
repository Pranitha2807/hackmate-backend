import express from "express";
import {
  createTeam,
  getTeams,
  joinTeam,
  getMyTeams,
    updateTeam,
    deleteTeam,
    leaveTeam,
} from "../controllers/teamController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:id/join", protect, joinTeam);
router.post("/", protect, createTeam);
router.get("/", getTeams);
router.get("/my-teams", protect, getMyTeams);
router.put("/:id", protect, updateTeam);
router.delete("/:id", protect, deleteTeam);
router.put("/:id/leave", protect, leaveTeam);

export default router;