// src/utils/copyleaksAuth.js
const axios = require("axios");

let cachedToken = null;
let tokenExpiresAt = 0;

async function getCopyleaksToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) return cachedToken;

  const email = process.env.COPYLEAKS_EMAIL;
  const key = process.env.COPYLEAKS_API_KEY;

  const res = await axios.post(
    "https://id.copyleaks.com/v3/account/login/api",
    { email, key },
    { headers: { "Content-Type": "application/json" } }
  ); // [web:61][web:22]

  const { access_token, expires_in } = res.data;
  cachedToken = access_token;
  tokenExpiresAt = now + (expires_in || 3600) * 1000;
  return cachedToken;
}

module.exports = { getCopyleaksToken };
