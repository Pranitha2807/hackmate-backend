import Team from "../models/Team.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments();

    const myTeams = await Team.countDocuments({
      members: req.user,
    });

    const totalMessages = await Message.countDocuments({
      sender: req.user,
    });

    const user = await User.findById(req.user);

    let profileCompleted = 0;

    if (user.fullName) profileCompleted += 20;
    if (user.email) profileCompleted += 20;
    if (user.college) profileCompleted += 20;
    if (user.branch) profileCompleted += 20;
    if (user.skills && user.skills.length > 0) profileCompleted += 20;

    res.json({
      totalTeams,
      myTeams,
      totalMessages,
      profileCompleted,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};