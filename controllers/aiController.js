
import { GoogleGenAI } from "@google/genai";
import User from "../models/User.js";
import Team from "../models/Team.js";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const matchTeams = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return res.status(500).json({
        message: "AI service is not configured.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const user = await User.findById(req.user).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

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
You are HackMate's AI team-matching assistant.

Recommend up to 3 suitable teams for this student.

Student:
Name: ${user.fullName}
Skills: ${JSON.stringify(user.skills || [])}
Branch: ${user.branch || "Not provided"}
Year: ${user.year || "Not provided"}

Available teams:
${JSON.stringify(teamData)}

Return ONLY valid JSON:
{
  "recommendations": [
    {
      "teamId": "exact team id",
      "teamName": "exact team name",
      "matchScore": 90,
      "reason": "Short explanation"
    }
  ]
}

Rules:
- Recommend at most 3 teams.
- Use only the provided teams.
- Match scores must be between 0 and 100.
- Consider transferable skills.
- Keep reasons short and clear.
- Return an empty recommendations array if appropriate.
`;

    const models = [
      process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
      process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash",
      "gemini-2.0-flash",
    ];

    let response = null;
    let lastError = null;

    for (const model of [...new Set(models)]) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(
            `AI matching: trying ${model}, attempt ${attempt}`
          );

          response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });

          if (response?.text) {
            break;
          }

          throw new Error("Gemini returned an empty response");
        } catch (error) {
          lastError = error;
          response = null;

          const status = Number(error.status || error.code);

          console.error(
            `Gemini model ${model} failed:`,
            status,
            error.message
          );

          const retryable = [
            429, 500, 502, 503, 504,
          ].includes(status);

          if (!retryable || attempt === 2) {
            break;
          }

          await sleep(1500);
        }
      }

      if (response?.text) {
        break;
      }
    }

    if (!response?.text) {
      console.error(
        "All Gemini models failed:",
        lastError?.message
      );

      return res.status(503).json({
        message:
          "AI matching is temporarily unavailable. Please try again shortly.",
      });
    }

    let result;

    try {
      result = JSON.parse(response.text);
    } catch (error) {
      console.error("Invalid Gemini JSON:", error.message);

      return res.status(502).json({
        message: "AI returned an invalid response. Please try again.",
      });
    }

    if (!Array.isArray(result.recommendations)) {
      return res.status(502).json({
        message: "AI returned an unexpected response format.",
      });
    }

    const validTeams = new Map(
      teamData.map((team) => [team.id, team])
    );

    result.recommendations = result.recommendations
      .filter((item) => validTeams.has(item.teamId))
      .slice(0, 3)
      .map((item) => ({
        ...item,
        teamName: validTeams.get(item.teamId).teamName,
        matchScore: Math.max(
          0,
          Math.min(100, Number(item.matchScore) || 0)
        ),
        reason: String(
          item.reason || "Skills may be a good match."
        ),
      }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("AI Team Matching Error:", error);

    return res.status(500).json({
      message: "AI team matching failed. Please try again.",
    });
  }
};
