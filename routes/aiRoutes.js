import express from "express";
import { matchTeams } from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// AI Team Matching
router.post("/match-teams", protect, matchTeams);

export default router;