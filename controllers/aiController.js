import { GoogleGenAI } from "@google/genai";
import User from "../models/User.js";
import Team from "../models/Team.js";

export const matchTeams = async (req, res) => {
  try {
    // Create Gemini client after environment variables are loaded
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Get logged-in user
    const user = await User.findById(req.user).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Get available teams
    const teams = await Team.find()
      .populate("leader", "fullName")
      .populate("members", "fullName");

    if (teams.length === 0) {
      return res.status(404).json({
        message: "No teams available",
      });
    }

    const teamData = teams.map((team) => ({
      id: team._id.toString(),
      teamName: team.teamName,
      description: team.description,
      requiredSkills: team.requiredSkills,
      maxMembers: team.maxMembers,
      currentMembers: team.members.length,
    }));

    const prompt = `
You are the AI matching assistant for HackMate.

Your job is to recommend the best teams for a student based on their skills.

Student:
Name: ${user.fullName}
Skills: ${user.skills || "No skills provided"}
Branch: ${user.branch || "Not provided"}
Year: ${user.year || "Not provided"}

Available Teams:
${JSON.stringify(teamData, null, 2)}

Analyze the student's skills against the required skills of each team.

Return ONLY valid JSON in this exact format:

{
  "recommendations": [
    {
      "teamId": "team id",
      "teamName": "team name",
      "matchScore": 90,
      "reason": "Short explanation of why this team is a good match."
    }
  ]
}

Rules:
- Return at most 3 recommendations.
- Match score must be between 0 and 100.
- Higher scores mean stronger skill matches.
- Consider related or transferable skills.
- Do not invent teams.
- Use only teams provided above.
- Keep reasons short and clear.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text);

    res.status(200).json(result);
  } catch (error) {
    console.error("AI Team Matching Error:", error);

    res.status(500).json({
      message: "AI team matching failed",
      error: error.message,
    });
  }
};