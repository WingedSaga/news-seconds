const { getStripeClient } = require('../services/stripe');
const { supabase } = require('../db/supabase');

function publicSiteUrl() {
  return (process.env.CLIENT_URL || 'https://news-seconds.duckdns.org').replace(/\/$/, '');
}

async function createSubscriptionCheckout(req, res, next) {
  try {
    const stripe = getStripeClient();
    const price = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;

    if (!stripe || !price) {
      return res.status(503).json({ message: 'Оплата временно недоступна. Попробуйте позже.' });
    }

    const { data: savedSubscription, error: subscriptionLookupError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (subscriptionLookupError) throw subscriptionLookupError;

    let customerId = savedSubscription?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.username,
        metadata: { news_seconds_user_id: req.user.id },
      });
      customerId = customer.id;
    }

    const siteUrl = publicSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: req.user.id,
      line_items: [{ price, quantity: 1 }],
      success_url: `${siteUrl}/support?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/support?checkout=cancelled`,
      managed_payments: { enabled: true },
      metadata: { news_seconds_user_id: req.user.id },
      subscription_data: { metadata: { news_seconds_user_id: req.user.id } },
    });

    const { error: subscriptionSaveError } = await supabase.from('user_subscriptions').upsert(
      {
        user_id: req.user.id,
        stripe_customer_id: customerId,
        stripe_checkout_session_id: session.id,
        stripe_price_id: price,
        status: 'checkout_created',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (subscriptionSaveError) throw subscriptionSaveError;

    return res.status(201).json({ url: session.url });
  } catch (err) {
    return next(err);
  }
}

async function handleStripeWebhook(req, res) {
  const stripe = getStripeClient();
  const signature = req.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !signature || !webhookSecret) {
    return res.status(400).json({ message: 'Неверный webhook Stripe' });
  }

  let event;
  try {
    // req.body must remain the original Buffer: Stripe signs the unmodified body.
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (_err) {
    return res.status(400).json({ message: 'Неверная подпись webhook Stripe' });
  }

  if (event.type === 'checkout.session.completed') {
    // Do not mark a payment as successful from the browser redirect. Stripe's
    // signed webhook is the source of truth. Subscription records can be
    // attached here when the project introduces paid member benefits.
    const session = event.data.object;
    const userId = session.client_reference_id || session.metadata?.news_seconds_user_id;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

    if (userId && subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const { error } = await supabase.from('user_subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: String(session.customer),
            stripe_subscription_id: subscription.id,
            stripe_checkout_session_id: session.id,
            stripe_price_id: subscription.items.data[0]?.price?.id || null,
            status: subscription.status,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
        if (error) throw error;
      } catch (err) {
        console.error('[stripe] failed to persist subscription:', err.message);
        return res.status(500).json({ message: 'Не удалось обработать webhook Stripe' });
      }
    }

    console.info(`[stripe] checkout.session.completed ${session.id}`);
  }

  return res.status(200).json({ received: true });
}

module.exports = { createSubscriptionCheckout, handleStripeWebhook };
