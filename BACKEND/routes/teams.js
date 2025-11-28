const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');

const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

// Create a new team
// Create a new team with DP and admin logic
router.post('/create', authenticate, async (req, res) => {
  try {
    const { name, description, memberIds, adminIds, dp_url } = req.body;
    const creatorId = req.user.userId;
    
    // Create team with only creator as member and admin initially
    const members = [new mongoose.Types.ObjectId(creatorId)];
    const admins = [new mongoose.Types.ObjectId(creatorId)];
    
    const team = new Team({
      name,
      description,
      dp_url: dp_url || '',
      members,
      admins,
      resources: []
    });
    await team.save();
    
    // Send invites to selected members (except creator)
    if (memberIds && memberIds.length > 0) {
      const filteredMemberIds = memberIds.filter(id => id && id !== creatorId && id !== '');
      const invitePromises = filteredMemberIds
        .map(async (memberId) => {
          const user = await User.findById(memberId);
          if (user) {
            user.pendingTeamInvites.push({
              teamId: team._id,
              teamName: team.name,
              invitedBy: creatorId
            });
            await user.save();
            
            // Create notification
            const notification = new Notification({
              userId: memberId,
              type: 'team_invite',
              title: 'Team Invitation',
              message: `You have been invited to join the team "${team.name}"`,
              data: { teamId: team._id, teamName: team.name, invitedBy: creatorId }
            });
            await notification.save();
          }
        });
      await Promise.all(invitePromises);
    }
    
    res.json({ success: true, team });
  } catch (err) {
    console.error('Team creation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Accept team invite
router.post('/accept-invite/:teamId', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    const inviteIndex = user.pendingTeamInvites.findIndex(invite => invite.teamId.toString() === teamId);
    if (inviteIndex === -1) return res.status(404).json({ success: false, error: 'Invite not found' });
    
    // Add user to team members
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    
    if (!team.members.includes(userId)) {
      team.members.push(mongoose.Types.ObjectId(userId));
      await team.save();
    }
    
    // Remove invite
    user.pendingTeamInvites.splice(inviteIndex, 1);
    await user.save();
    
    // Mark notification as read
    await Notification.updateMany(
      { userId, 'data.teamId': teamId, type: 'team_invite' },
      { isRead: true }
    );
    
    // Emit socket event to update UI in real-time
    const io = req.app.get('io');
    console.log('Emitting invite_accepted to user:', userId, 'for team:', teamId);
    io.to(`user_${userId}`).emit('invite_accepted', { teamId, userId });
    console.log('Emitting team_member_joined to team:', teamId, 'for user:', user.name);
    io.to(`team_${teamId}`).emit('team_member_joined', { teamId, userId, userName: user.name });
    
    res.json({ success: true, message: 'Invite accepted' });
  } catch (err) {
    console.error('Accept invite error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reject team invite
router.post('/reject-invite/:teamId', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    const inviteIndex = user.pendingTeamInvites.findIndex(invite => invite.teamId.toString() === teamId);
    if (inviteIndex === -1) return res.status(404).json({ success: false, error: 'Invite not found' });
    
    // Remove invite
    user.pendingTeamInvites.splice(inviteIndex, 1);
    await user.save();
    
    // Mark notification as read
    await Notification.updateMany(
      { userId, 'data.teamId': teamId, type: 'team_invite' },
      { isRead: true }
    );
    
    // Emit socket event to update UI in real-time
    const io = req.app.get('io');
    io.to(`user_${userId}`).emit('invite_rejected', { teamId, userId });
    
    res.json({ success: true, message: 'Invite rejected' });
  } catch (err) {
    console.error('Reject invite error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark notifications as read
router.post('/notifications/mark-read', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationIds } = req.body;
    if (notificationIds && notificationIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, userId },
        { isRead: true }
      );
    } else {
      // Mark all as read
      await Notification.updateMany({ userId }, { isRead: true });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all teams for a user
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('GET /my - userId:', userId);
    // Populate members and admins with user details
    const teams = await Team.find({ members: userId })
      .populate('members', 'name email _id')
      .populate('admins', 'name email _id');
    console.log('Found teams:', teams.length, teams.map(t => ({ id: t._id, name: t.name, members: t.members.map(m => m._id) })));
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
    console.error('Error in GET /my:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add a pooled resource to a team
router.post('/:teamId/resources', authenticate, async (req, res) => {
  try {
    const { name, description, quantity, owner, status, image_url } = req.body;
    const userId = req.user.userId;
    
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    
    console.log('=== ADD RESOURCE DEBUG ===');
    console.log('userId:', userId, 'type:', typeof userId);
    console.log('userId.toString():', userId.toString());
    console.log('team.members:', team.members);
    console.log('team.members mapped:', team.members.map(m => ({ id: m, toString: m.toString() })));
    console.log('Member check result:', team.members.some(member => {
      const result = member.toString() === userId.toString();
      console.log(`  Comparing ${member.toString()} === ${userId.toString()}: ${result}`);
      return result;
    }));
    
    if (!team.members.some(member => member.toString() === userId.toString())) return res.status(403).json({ success: false, error: 'Not a team member' });
    
    team.resources.push({ name, description, quantity, owner, status, image_url });
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
    console.log('GET resources request for team:', req.params.teamId);
    console.log('Authorization header:', req.headers.authorization);
    const team = await Team.findById(req.params.teamId).populate('resources.owner', 'name email');
    if (!team) {
      console.log('Team not found');
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    console.log('Team found, resources:', team.resources.length);
    res.json({ success: true, resources: team.resources });
  } catch (err) {
    console.error('Error in GET resources:', err);
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
    if (!team.admins.some(admin => admin.toString() === userId.toString())) {
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
    if (!team.admins.some(admin => admin.toString() === userId.toString())) {
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
    if (!team.admins.some(admin => admin.toString() === userId.toString())) {
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
    console.log('GET tasks - userId:', userId, 'teamId:', req.params.teamId);
    const team = await Team.findById(req.params.teamId);
    
    if (!team) {
      console.log('Team not found');
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    
    console.log('Team members:', team.members.map(m => m.toString()));
    console.log('User ID type:', typeof userId, 'Value:', userId);
    console.log('User in members:', team.members.some(member => member.toString() === userId.toString()));
    
    if (!team.members.some(member => member.toString() === userId.toString())) {
      console.log('User not a team member');
      return res.status(403).json({ success: false, error: 'Not a team member' });
    }
    
    const tasks = await Task.find({ team: req.params.teamId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, tasks });
  } catch (err) {
    console.error('Error in GET tasks:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get activity for a team
router.get('/:teamId/activity', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const team = await Team.findById(req.params.teamId);
    
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    if (!team.members.some(member => member.toString() === userId.toString())) return res.status(403).json({ success: false, error: 'Not a team member' });
    
    const activity = await Activity.find({ team: req.params.teamId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, activity });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get team messages
router.get('/:teamId/messages', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('GET messages - userId:', userId, 'teamId:', req.params.teamId);
    const team = await Team.findById(req.params.teamId);
    
    if (!team) {
      console.log('Team not found');
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    
    console.log('Team members:', team.members.map(m => m.toString()));
    console.log('User ID type:', typeof userId, 'Value:', userId);
    console.log('User in members:', team.members.some(member => member.toString() === userId.toString()));
    
    if (!team.members.some(member => member.toString() === userId.toString())) {
      console.log('User not a team member');
      return res.status(403).json({ success: false, error: 'Not a team member' });
    }
    
    const Message = require('../models/Message');
    const messages = await Message.find({ 
      teamId: req.params.teamId,
      type: 'group'
    })
      .populate('senderId', 'name email')
      .sort({ createdAt: 1 })
      .limit(100);
    
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Error in GET messages:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send team message
router.post('/:teamId/messages', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }
    
    const team = await Team.findById(req.params.teamId);
    
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    if (!team.members.some(member => member.toString() === userId.toString())) return res.status(403).json({ success: false, error: 'Not a team member' });
    
    const Message = require('../models/Message');
    const message = new Message({
      senderId: userId,
      teamId: req.params.teamId,
      content: content.trim(),
      type: 'group'
    });
    
    await message.save();
    
    // Populate sender info for response
    await message.populate('senderId', 'name email');
    
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clear all messages in a team (admin only)
router.delete('/:teamId/messages/clear', authenticate, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;
    const io = req.app.get('io');

    // Check if user is admin of the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (!team.admins.some(admin => admin.toString() === userId.toString())) {
      return res.status(403).json({ success: false, message: 'Only admins can clear chat' });
    }

    // Delete all messages in the team
    const Message = require('../models/Message');
    await Message.deleteMany({ teamId: teamId, type: 'group' });

    // Notify all team members via socket
    if (io) {
      console.log(`Emitting chatCleared to room: team_${teamId}`);
      io.to(`team_${teamId}`).emit('chatCleared', { clearedBy: req.user.name });
    }

    res.json({ success: true, message: 'Chat cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({ success: false, message: 'Failed to clear chat' });
  }
});

// Edit message (sender only)
router.put('/messages/:messageId/edit', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    const io = req.app.get('io');

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // Find message and check ownership
    const Message = require('../models/Message');
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    // Update message
    message.content = content.trim();
    message.edited = true;
    await message.save();

    // Populate sender info for response
    await message.populate('senderId', 'name email');

    // Notify team members via socket
    if (io) {
      console.log(`Emitting messageEdited to room: team_${message.teamId.toString()}`);
      io.to(`team_${message.teamId.toString()}`).emit('messageEdited', {
        messageId,
        content: message.content,
        edited: true
      });
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
});

// Delete message (sender only)
router.delete('/messages/:messageId/delete', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    const io = req.app.get('io');

    // Find message and check ownership
    const Message = require('../models/Message');
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

    // Delete message
    await Message.findByIdAndDelete(messageId);

    // Notify team members via socket
    if (io) {
      console.log(`Emitting messageDeleted to room: team_${message.teamId.toString()}`);
      io.to(`team_${message.teamId.toString()}`).emit('messageDeleted', { messageId });
    }

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
});

module.exports = router;