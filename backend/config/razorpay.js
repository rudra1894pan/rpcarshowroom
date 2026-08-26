const Razorpay = require('razorpay');

let client = null;

function getRazorpay() {
  if (client) return client;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('Razorpay not configured — payment endpoints will return an error until RAZORPAY_KEY_ID/SECRET are set.');
    return null;
  }
  client = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return client;
}

module.exports = getRazorpay;
