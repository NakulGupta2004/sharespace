const express = require('express');
const router = express.Router();

// Placeholder routes for users
// TODO: Implement user management routes

router.get('/', (req, res) => {
  res.json({ message: 'Users routes - Coming soon' });
});

module.exports = router;