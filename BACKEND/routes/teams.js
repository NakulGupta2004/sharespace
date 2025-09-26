const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');

const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// Create a new team
// Create a new team with DP and admin logic
router.post('/create', authenticate, async (req, res) => {
  try {
    const { name, description, memberIds, adminIds, dp_url } = req.body;
  const creatorId = req.user.userId;
  // Ensure creator is a member and admin, filter out empty strings
  const members = Array.from(new Set([creatorId, ...(memberIds || [])])).filter(id => id && id !== '').map(id => new mongoose.Types.ObjectId(id));
  const admins = Array.from(new Set([creatorId, ...(adminIds || [])])).filter(id => id && id !== '').map(id => new mongoose.Types.ObjectId(id));
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
    // Populate members and admins with user details
    const teams = await Team.find({ members: userId })
      .populate('members', 'name email _id')
      .populate('admins', 'name email _id');
    // For frontend compatibility, convert admins to array of user objects
    const teamsWithRoles = teams.map(team => ({
      ...team.toObject(),
      admins: team.admins.map(admin => ({
        _id: admin._id,
        name: admin.name,
        email: admin.email
      })),
      members: team.members.map(member => ({
        _id: member._id,
        name: member.name,
        email: member.email
      }))
    }));
    res.json({ success: true, teams: teamsWithRoles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add a pooled resource to a team
router.post('/:teamId/resources', authenticate, async (req, res) => {
  try {
    const { name, description, quantity, owner, status } = req.body;
    const userId = req.user.userId;
    
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    
    if (!team.members.includes(userId)) return res.status(403).json({ success: false, error: 'Not a team member' });
    
    team.resources.push({ name, description, quantity, owner, status });
    await team.save();
    
    // Log activity
    await Activity.create({
      type: 'resource_added',
      description: `Resource "${name}" was added to the team`,
      team: req.params.teamId,
      user: userId,
      metadata: {
        resourceName: name,
        quantity,
        status
      }
    });
    
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

// Update team details
router.put('/:teamId/update', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;
    
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    
    // Check if user is admin
    if (!team.admins.some(admin => admin.toString() === userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    const oldName = team.name;
    const oldDescription = team.description;
    
    team.name = name || team.name;
    team.description = description || team.description;
    await team.save();
    
    // Log activity
    await Activity.create({
      type: 'team_updated',
      description: `Team details updated by admin`,
      team: req.params.teamId,
      user: userId,
      metadata: {
        oldName,
        newName: team.name,
        oldDescription,
        newDescription: team.description
      }
    });
    
    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Remove a member from team
router.post('/:teamId/remove-member', authenticate, async (req, res) => {
  try {
    const { memberId } = req.body;
    const userId = req.user.userId;
    
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    
    // Check if user is admin
    if (!team.admins.some(admin => admin.toString() === userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    // Cannot remove yourself if you're the only admin
    if (memberId === userId && team.admins.length === 1) {
      return res.status(400).json({ success: false, error: 'Cannot remove yourself as the only admin' });
    }
    
    // Get member details for activity log
    const removedUser = await User.findById(memberId);
    
    // Remove from members and admins
    team.members = team.members.filter(id => id.toString() !== memberId);
    team.admins = team.admins.filter(id => id.toString() !== memberId);
    
    await team.save();
    
    // Log activity
    await Activity.create({
      type: 'member_removed',
      description: `${removedUser ? removedUser.name : 'Member'} was removed from the team`,
      team: req.params.teamId,
      user: userId,
      metadata: {
        removedUserId: memberId,
        removedUserName: removedUser ? removedUser.name : 'Unknown'
      }
    });
    
    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete team
router.delete('/:teamId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    
    // Check if user is admin
    if (!team.admins.some(admin => admin.toString() === userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    // Log activity before deletion
    await Activity.create({
      type: 'team_deleted',
      description: `Team "${team.name}" was deleted`,
      team: req.params.teamId,
      user: userId,
      metadata: {
        teamName: team.name,
        teamDescription: team.description
      }
    });
    
    await Team.findByIdAndDelete(req.params.teamId);
    
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get tasks for a team
router.get('/:teamId/tasks', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const team = await Team.findById(req.params.teamId);
    
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    if (!team.members.includes(userId)) return res.status(403).json({ success: false, error: 'Not a team member' });
    
    const tasks = await Task.find({ team: req.params.teamId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get activity for a team
router.get('/:teamId/activity', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const team = await Team.findById(req.params.teamId);
    
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    if (!team.members.includes(userId)) return res.status(403).json({ success: false, error: 'Not a team member' });
    
    const activity = await Activity.find({ team: req.params.teamId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, activity });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;