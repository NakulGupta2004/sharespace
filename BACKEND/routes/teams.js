const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const Team = require('../models/Team');
const User = require('../models/User');

// Create a new team
// Create a new team with DP and admin logic
router.post('/create', authenticate, async (req, res) => {
  try {
    const { name, description, memberIds, adminIds, dp_url } = req.body;
  const creatorId = req.user.userId;
  // Ensure creator is a member and admin, filter out empty strings
  const members = Array.from(new Set([creatorId, ...(memberIds || [])])).filter(id => id && id !== '');
  const admins = Array.from(new Set([creatorId, ...(adminIds || [])])).filter(id => id && id !== '');
    const team = new Team({
      name,
      description,
      dp_url: dp_url || '',
      members,
      admins,
      resources: []
    });
    await team.save();
    res.json({ success: true, team });
  } catch (err) {
    console.error('Team creation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all teams for a user
router.get('/my', authenticate, async (req, res) => {
  try {
  const userId = req.user.userId;
    const teams = await Team.find({ members: userId });
    res.json({ success: true, teams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add a pooled resource to a team
router.post('/:teamId/resources', async (req, res) => {
  try {
    const { name, description, quantity, owner, status } = req.body;
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    team.resources.push({ name, description, quantity, owner, status });
    await team.save();
    res.json({ success: true, resources: team.resources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get pooled resources for a team
router.get('/:teamId/resources', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).populate('resources.owner', 'name email');
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    res.json({ success: true, resources: team.resources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;