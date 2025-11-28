const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  quantity: { type: Number, default: 1 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['available', 'in_use', 'maintenance'], default: 'available' },
  image_url: { type: String, default: '' },
  lastUpdated: { type: Date, default: Date.now }
});

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  dp_url: { type: String, default: '' }, // Team display picture
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  resources: [ResourceSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Team', TeamSchema);