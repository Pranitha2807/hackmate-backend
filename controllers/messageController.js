import Message from "../models/Message.js";

// Get all messages of a team
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      team: req.params.teamId,
    }).populate("sender", "fullName _id")

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Save new message
export const sendMessage = async (req, res) => {
  try {
    const message = await Message.create({
      team: req.params.teamId,
      sender: req.user,
      message: req.body.message,
    });

    const populated = await Message.findById(message._id).populate(
      "sender",
      "fullName"
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};