/**
 * app.test.js - Backend API Tests
 *
 * Tests for the Settings Management API endpoints.
 * Uses Vitest for testing and Supertest for HTTP assertions.
 *
 * Run tests: npm test
 * Run tests in watch mode: npm run test:watch
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app, { clearDatabase } from './app.js';

// Clear database before each test for isolation
beforeEach(() => {
  clearDatabase();
});

describe('Settings API', () => {

  // POST /settings
  describe('POST /settings', () => {
    it('should create a new settings object and return 201', async () => {
      const newSettings = { theme: 'dark', language: 'en' };

      const response = await request(app)
          .post('/settings')
          .send(newSettings)
          .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      // Verify data matches what we sent
      expect(response.body.data).toEqual(newSettings);

      // Verify ID is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.body.id).toMatch(uuidRegex);
    });

    it('should accept any valid JSON structure', async () => {
      const complexSettings = {
        nested: { level1: { level2: 'value' } },
        array: [1, 2, 3],
        number: 42,
        boolean: true
      };

      const response = await request(app)
          .post('/settings')
          .send(complexSettings)
          .expect(201);

      expect(response.body.data).toEqual(complexSettings);
    });
  });

  // GET /settings
  describe('GET /settings', () => {
    it('should return empty array when no settings exist', async () => {
      const response = await request(app)
          .get('/settings')
          .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return paginated results', async () => {
      // Create 6 settings
      for (let i = 1; i <= 6; i++) {
        await request(app)
            .post('/settings')
            .send({ item: i });
      }

      // Get first page (default limit is 5)
      const page1 = await request(app)
          .get('/settings?page=1&limit=5')
          .expect(200);


      expect(page1.body.data.length).toBe(5);
      expect(page1.body.pagination.page).toBe(1);
      expect(page1.body.pagination.total).toBe(6);
      expect(page1.body.pagination.totalPages).toBe(2);

      // Get second page
      const page2 = await request(app)
          .get('/settings?page=2&limit=5')
          .expect(200);

      expect(page2.body.data.length).toBe(1);
      expect(page2.body.pagination.page).toBe(2);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      // Create a settings item first
      await request(app)
          .post('/settings')
          .send({ test: 'data' });

      // Test negative page and limit
      const response = await request(app)
          .get('/settings?page=-1&limit=-1')
          .expect(200);

      // Should default to page 1, limit 1 (minimum values)
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  // GET /settings/:id
  describe('GET /settings/:id', () => {
    it('should return 404 for non-existent ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
          .get(`/settings/${fakeId}`)
          .expect(404);

      expect(response.body.error).toBe('Settings not found');
    });

    it('should return the settings object for valid ID', async () => {
      // Create a settings object first
      const createResponse = await request(app)
          .post('/settings')
          .send({ key: 'value' });

      const id = createResponse.body.id;

      // Fetch it by ID
      const response = await request(app)
          .get(`/settings/${id}`)
          .expect(200);

      expect(response.body.id).toBe(id);
      expect(response.body.data).toEqual({ key: 'value' });
    });
  });

  // PUT /settings/:id
  describe('PUT /settings/:id', () => {
    it('should return 404 for non-existent ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
          .put(`/settings/${fakeId}`)
          .send({ new: 'data' })
          .expect(404);

      expect(response.body.error).toBe('Settings not found');
    });

    it('should replace the entire settings object', async () => {
      // Create a settings object
      const createResponse = await request(app)
          .post('/settings')
          .send({ original: 'data', keep: 'this' });

      const id = createResponse.body.id;

      // Replace it entirely
      const updateResponse = await request(app)
          .put(`/settings/${id}`)
          .send({ completely: 'new' })
          .expect(200);

      expect(updateResponse.body.data).toEqual({ completely: 'new' });

      // Verify original data is gone
      const getResponse = await request(app)
          .get(`/settings/${id}`)
          .expect(200);

      expect(getResponse.body.data).not.toHaveProperty('original');
      expect(getResponse.body.data).not.toHaveProperty('keep');
    });
  });

  // DELETE /settings/:id
  describe('DELETE /settings/:id', () => {
    it('should return 204 for existing ID', async () => {
      // Create a settings object
      const createResponse = await request(app)
          .post('/settings')
          .send({ toDelete: true });

      const id = createResponse.body.id;

      // Delete it
      await request(app)
          .delete(`/settings/${id}`)
          .expect(204);

      // Verify it's gone
      await request(app)
          .get(`/settings/${id}`)
          .expect(404);
    });

    it('should be idempotent - return 204 even for non-existent ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      // Delete non-existent ID should still return 204
      await request(app)
          .delete(`/settings/${fakeId}`)
          .expect(204);

      // Calling delete again should also return 204
      await request(app)
          .delete(`/settings/${fakeId}`)
          .expect(204);
    });
  });

  // Parameter Validation
  describe('Parameter Validation', () => {
    it('should handle empty body in POST request', async () => {
      const response = await request(app)
          .post('/settings')
          .send({})
          .expect(201);

      // Should create with empty object
      expect(response.body.data).toEqual({});
    });

    it('should handle null values in JSON body', async () => {
      const response = await request(app)
          .post('/settings')
          .send({ key: null, nested: { value: null } })
          .expect(201);

      expect(response.body.data.key).toBeNull();
      expect(response.body.data.nested.value).toBeNull();
    });

    it('should handle various data types in JSON body', async () => {
      const mixedData = {
        string: 'text',
        number: 42,
        float: 3.14,
        boolean: true,
        array: [1, 'two', false],
        object: { nested: 'value' },
        nullValue: null
      };

      const response = await request(app)
          .post('/settings')
          .send(mixedData)
          .expect(201);

      expect(response.body.data).toEqual(mixedData);
    });

    it('should handle non-integer pagination parameters', async () => {
      const response = await request(app)
          .get('/settings?page=1.5&limit=2.9')
          .expect(200);

      // parseInt should truncate to integers
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should handle string pagination parameters', async () => {
      const response = await request(app)
          .get('/settings?page=abc&limit=xyz')
          .expect(200);

      // Default to 1 and 5
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should handle special characters in ID parameter', async () => {
      // Return 404, not crash
      await request(app)
          .get('/settings/not-a-valid-uuid')
          .expect(404);

      await request(app)
          .get('/settings/12345')
          .expect(404);
    });
  });

  // Health Check
  describe('GET /health', () => {
    it('should return status ok', async () => {
      const response = await request(app)
          .get('/health')
          .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });
});