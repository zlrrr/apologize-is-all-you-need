import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Run tests sequentially to avoid database conflicts
    // when multiple test files use the production database
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    // Set environment variables for tests
    env: {
      // Admin credentials for testing
      DEFAULT_ADMIN_USERNAME: 'admin',
      DEFAULT_ADMIN_PASSWORD: 'admin123',
      // JWT secret for testing
      JWT_SECRET: 'test-jwt-secret-key',
    },
  },
});
