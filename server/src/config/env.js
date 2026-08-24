require('dotenv').config({ quiet: true });

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
const missing = required.filter((key) => process.env[key] === undefined);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    expiresInMs: parseDurationMs(process.env.JWT_EXPIRES_IN || '15m'),
  },
  cookieName: process.env.COOKIE_NAME || 'af_token',
};

// Parses simple duration strings ("15m", "1d", "30s", "2h") into milliseconds.
function parseDurationMs(value) {
  const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());
  if (!match) return 15 * 60 * 1000; // fallback: 15 minutes
  const amount = Number(match[1]);
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[match[2]];
  return amount * unitMs;
}
