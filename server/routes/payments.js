const express = require('express');
const { checkoutLimiter } = require('../middleware/rateLimiters');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createSubscriptionCheckout } = require('../controllers/paymentsController');

const router = express.Router();

// A visitor receives only a Stripe-hosted URL; all sensitive Stripe calls stay
// on the server and cannot be forged from the browser.
router.post('/stripe/checkout-session', authMiddleware, checkoutLimiter, createSubscriptionCheckout);

module.exports = router;
