/**
 * Vitest Configuration for Frontend Tests
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
                              plugins: [react()],
                              test: {
                                environment: 'jsdom',
                                // Setup file for test utilities
                                setupFiles: ['./src/test/setup.js'],
                                globals: true,
                                testTimeout: 10000
                              }
                            });