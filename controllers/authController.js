import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// ================= REGISTER USER =================
export const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      college,
      branch,
      year,
      skills,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      college,
      branch,
      year,
      skills,
    });

    // Save user
    await user.save();

    // Remove password before sending response
    const { password: _, ...userData } = user._doc;

    res.status(201).json({
      message: "User registered successfully!",
      user: userData,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= LOGIN USER =================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Password",
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Remove password before sending response
    const { password: _, ...userData } = user._doc;

    res.status(200).json({
      message: "Login Successful",
      token,
      user: userData,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
// ================= GET PROFILE =================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.fullName = req.body.fullName || user.fullName;
    user.college = req.body.college || user.college;
    user.branch = req.body.branch || user.branch;
    user.year = req.body.year || user.year;
    user.skills = req.body.skills || user.skills;

    const updatedUser = await user.save();

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};