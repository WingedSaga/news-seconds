const { supabase } = require('../db/supabase');

function browserName(userAgent) {
  if (/Edg\//i.test(userAgent)) return 'Edge';
  if (/OPR\//i.test(userAgent)) return 'Opera';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/DuckDuckGo\//i.test(userAgent)) return 'DuckDuckGo';
  if (/CriOS\//i.test(userAgent)) return 'Chrome';
  if (/Chrome\//i.test(userAgent)) return 'Chrome';
  if (/Safari\//i.test(userAgent)) return 'Safari';
  return 'Browser';
}

function deviceLabel(userAgent) {
  const browser = browserName(userAgent);
  if (/iPad/i.test(userAgent)) return `iPad · ${browser}`;
  if (/iPhone|iPod/i.test(userAgent)) return `iPhone · ${browser}`;
  if (/Android/i.test(userAgent)) return `Android · ${browser}`;
  if (/Windows/i.test(userAgent)) return `Windows · ${browser}`;
  if (/Macintosh|Mac OS X/i.test(userAgent)) return `Mac · ${browser}`;
  if (/Linux/i.test(userAgent)) return `Linux · ${browser}`;
  return browser;
}

function clientIp(req) {
  const value = req.get('cf-connecting-ip') || req.get('x-forwarded-for') || req.ip || '';
  const ip = String(value).split(',')[0].trim();
  return ip || null;
}

async function recordSuccessfulLogin(req, userId) {
  const userAgent = String(req.get('user-agent') || '').slice(0, 500);
  const { error } = await supabase.from('login_activity').insert({
    user_id: userId,
    ip_address: clientIp(req),
    user_agent: userAgent,
    device_label: deviceLabel(userAgent),
  });

  if (error) throw error;
}

module.exports = { recordSuccessfulLogin };
