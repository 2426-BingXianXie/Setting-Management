/**
 * Test Setup File
 *
 * Configures the testing environment with jest-dom matchers
 * for improved assertions on DOM elements.
 */

import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);