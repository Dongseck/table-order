import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

function optional(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.trim() !== '' ? v : fallback;
}

export const config = {
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '16h'),
  port: parseInt(optional('PORT', '3000'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
};
