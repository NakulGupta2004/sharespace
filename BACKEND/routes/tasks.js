const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const Task = require('../models/Task');
const Team = require('../models/Team');
const Activity = require('../models/Activity');

// Create a new task
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, teamId, assignedTo, priority, dueDate } = req.body;
    const userId = req.user.userId;
    
    // Check if user is member of the team
    const team = await Team.findById(teamId);
    if (!team || !team.members.includes(userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    const task = new Task({
      title,
      description,
      team: teamId,
      assignedTo,
      priority,
      dueDate,
      createdBy: userId
    });
    
    await task.save();
    
    // Log activity
    await Activity.create({
      type: 'task_created',
      description: `Task "${title}" was created`,
      team: teamId,
      user: userId,
      metadata: {
        taskId: task._id,
        assignedTo
      }
    });
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    res.json({ success: true, task: populatedTask });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update task status
router.put('/:taskId', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.userId;
    
    const task = await Task.findById(req.params.taskId).populate('team');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    
    // Check if user is member of the team
    if (!task.team.members.includes(userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    const oldStatus = task.status;
    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }
    await task.save();
    
    // Log activity
    await Activity.create({
      type: 'task_updated',
      description: `Task "${task.title}" status changed from ${oldStatus} to ${status}`,
      team: task.team._id,
      user: userId,
      metadata: {
        taskId: task._id,
        oldStatus,
        newStatus: status
      }
    });
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    res.json({ success: true, task: populatedTask });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete task
router.delete('/:taskId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const task = await Task.findById(req.params.taskId).populate('team');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    
    // Check if user is member of the team
    if (!task.team.members.includes(userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    await Task.findByIdAndDelete(req.params.taskId);
    
    // Log activity
    await Activity.create({
      type: 'task_deleted',
      description: `Task "${task.title}" was deleted`,
      team: task.team._id,
      user: userId,
      metadata: {
        taskId: req.params.taskId
      }
    });
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;