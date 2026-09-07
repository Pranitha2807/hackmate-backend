import Team from "../models/Team.js";

// ==========================
// Create Team
// ==========================
export const createTeam = async (req, res) => {
  try {
    const { teamName, description, requiredSkills, maxMembers } = req.body;

    const team = await Team.create({
      teamName,
      description,
      requiredSkills,
      maxMembers,
      leader: req.user,
      members: [req.user],
    });

    res.status(201).json({
      message: "Team Created Successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================
// Join Team
// ==========================
export const joinTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // Check if already joined
    if (team.members.includes(req.user)) {
      return res.status(400).json({
        message: "You already joined this team",
      });
    }

    // Check if team is full
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({
        message: "Team is full",
      });
    }

    // Add member
    team.members.push(req.user);

    await team.save();

    res.json({
      message: "Joined Team Successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
// Update Team
export const updateTeam = async (req, res) => {
  try {
    const { teamName, description, requiredSkills, maxMembers } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // Only the leader can edit
    if (team.leader.toString() !== req.user) {
      return res.status(403).json({
        message: "Only the team leader can edit this team",
      });
    }

    team.teamName = teamName;
    team.description = description;
    team.requiredSkills = requiredSkills;
    team.maxMembers = maxMembers;

    await team.save();

    res.json({
      message: "Team Updated Successfully",
      team,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================
// Get My Teams
// ==========================
export const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      members: req.user,
    }).populate("leader", "fullName email");

    res.json(teams);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================
// Get All Teams (Search)
// ==========================
export const getTeams = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            {
              teamName: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              requiredSkills: {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        }
      : {};

    const teams = await Team.find(keyword).populate(
      "leader",
      "fullName email"
    );

    res.json(teams);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
// Delete Team
export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // Only leader can delete
    if (team.leader.toString() !== req.user) {
      return res.status(403).json({
        message: "Only the team leader can delete this team",
      });
    }

    await Team.findByIdAndDelete(req.params.id);

    res.json({
      message: "Team Deleted Successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
// Leave Team
export const leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // Leader cannot leave
    if (team.leader.toString() === req.user) {
      return res.status(400).json({
        message: "Leader cannot leave the team. Delete the team instead."
      });
    }

    // Check membership
    if (!team.members.includes(req.user)) {
      return res.status(400).json({
        message: "You are not a member of this team"
      });
    }

    team.members = team.members.filter(
      member => member.toString() !== req.user
    );

    await team.save();

    res.json({
      message: "Left team successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};