let stripeClient;

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  if (!stripeClient) {
    stripeClient = require('stripe')(secretKey, {
      // Managed Payments is enabled by the integration blueprint on this preview API.
      apiVersion: '2026-02-25.preview',
    });
  }

  return stripeClient;
}

module.exports = { getStripeClient };
