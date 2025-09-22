const express = require('express');
const router = express.Router();

// Placeholder routes for tasks
// TODO: Implement task management routes

router.get('/', (req, res) => {
  res.json({ message: 'Tasks routes - Coming soon' });
});

module.exports = router;