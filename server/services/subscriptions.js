const { supabase } = require('../db/supabase');

function isMissingTable(error) {
  return error && (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || ''));
}

function isFuture(value) {
  return !value || new Date(value).getTime() > Date.now();
}

function entitlement(subscription, grant) {
  if (['active', 'trialing'].includes(subscription?.status) && isFuture(subscription.current_period_end)) {
    return { is_active: true, source: 'stripe', status: subscription.status, expires_at: subscription.current_period_end };
  }
  if (grant && isFuture(grant.expires_at)) {
    return { is_active: true, source: 'admin', status: 'admin_granted', expires_at: grant.expires_at };
  }
  return { is_active: false, source: null, status: null, expires_at: null };
}

async function getSubscriptionEntitlement(userId) {
  const [subscriptionResult, grantResult] = await Promise.all([
    supabase.from('user_subscriptions').select('status, current_period_end').eq('user_id', userId).maybeSingle(),
    supabase.from('subscription_grants').select('expires_at').eq('user_id', userId).maybeSingle(),
  ]);
  if (isMissingTable(subscriptionResult.error) || isMissingTable(grantResult.error)) return entitlement(null, null);
  if (subscriptionResult.error) throw subscriptionResult.error;
  if (grantResult.error) throw grantResult.error;
  return entitlement(subscriptionResult.data, grantResult.data);
}

async function getEntitlementsForUsers(userIds) {
  if (userIds.length === 0) return new Map();
  const [subscriptionResult, grantResult] = await Promise.all([
    supabase.from('user_subscriptions').select('user_id, status, current_period_end').in('user_id', userIds),
    supabase.from('subscription_grants').select('user_id, expires_at').in('user_id', userIds),
  ]);
  if (isMissingTable(subscriptionResult.error) || isMissingTable(grantResult.error)) return new Map();
  if (subscriptionResult.error) throw subscriptionResult.error;
  if (grantResult.error) throw grantResult.error;
  const subscriptions = new Map((subscriptionResult.data || []).map((row) => [row.user_id, row]));
  const grants = new Map((grantResult.data || []).map((row) => [row.user_id, row]));
  return new Map(userIds.map((userId) => [userId, entitlement(subscriptions.get(userId), grants.get(userId))]));
}

module.exports = { getSubscriptionEntitlement, getEntitlementsForUsers };
