import express from "express";
import {
  getMessages,
  sendMessage,
} from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:teamId", protect, getMessages);
router.post("/:teamId", protect, sendMessage);

export default router;
