// Unit test logika murni mobile (parser markdown, highlighter, client API).
// Modul native (expo-secure-store, react-native) di-mock di masing-masing file test.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.js'], restoreMocks: true },
});
