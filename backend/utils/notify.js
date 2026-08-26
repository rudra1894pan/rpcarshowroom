const Notification = require('../models/Notification');

// Fire-and-forget: never let a notification failure break the calling request.
const notify = async (userId, type, title, message, link) => {
  try {
    await Notification.create({ user: userId, type, title, message, link });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

module.exports = { notify };
