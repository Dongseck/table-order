// Test environment setup.
// Set TZ before any code under test runs.
process.env.TZ = 'Asia/Seoul';
process.env.NODE_ENV = 'test';

// Provide non-empty values for required env vars so config.ts doesn't throw.
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.PORT = process.env.PORT || '3001';
