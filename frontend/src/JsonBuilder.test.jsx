/**
 * JsonBuilder.test.jsx - Frontend Component Tests
 *
 * Tests for the Visual JSON Editor component.
 * Uses Vitest for testing and React Testing Library for component testing.
 *
 * Run tests: npm test
 * Run tests in watch mode: npm run test:watch
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JsonBuilder from './JsonBuilder';

describe('JsonBuilder Component', () => {

  // Rendering
  describe('Initial Rendering', () => {
    it('should render with default field', () => {
      const mockOnChange = vi.fn();
      const mockOnValidationChange = vi.fn();

      render(
          <JsonBuilder
              value='{"key": "value"}'
              onChange={mockOnChange}
              onValidationChange={mockOnValidationChange}
          />
      );

      // Should display the JSON brackets
      expect(screen.getByText('{')).toBeInTheDocument();
      expect(screen.getByText('}')).toBeInTheDocument();

      // Should have Add Field button
      expect(screen.getByText('+ Add Field')).toBeInTheDocument();
    });

    it('should parse initial JSON value into fields', () => {
      const mockOnChange = vi.fn();

      render(
          <JsonBuilder
              value='{"name": "John", "age": "30"}'
              onChange={mockOnChange}
              onValidationChange={vi.fn()}
          />
      );

      // Should have input fields with the values
      const inputs = screen.getAllByRole('textbox');
      const keyInputs = inputs.filter(input => input.classList.contains('json-key-input'));

      expect(keyInputs.length).toBe(2);
    });
  });

  // Adding Fields
  describe('Adding Fields', () => {
    it('should add a new field when clicking Add Field button', () => {
      const mockOnChange = vi.fn();

      render(
          <JsonBuilder
              value='{"key": "value"}'
              onChange={mockOnChange}
              onValidationChange={vi.fn()}
          />
      );

      // Count initial key inputs
      const initialKeyInputs = screen.getAllByRole('textbox')
          .filter(input => input.classList.contains('json-key-input'));
      const initialCount = initialKeyInputs.length;

      // Click Add Field
      fireEvent.click(screen.getByText('+ Add Field'));

      // Should have one more key input
      const newKeyInputs = screen.getAllByRole('textbox')
          .filter(input => input.classList.contains('json-key-input'));
      expect(newKeyInputs.length).toBe(initialCount + 1);
    });
  });

  // Removing Fields
  describe('Removing Fields', () => {
    it('should remove a field when clicking the remove button', () => {
      const mockOnChange = vi.fn();

      render(
          <JsonBuilder
              value='{"key1": "value1", "key2": "value2"}'
              onChange={mockOnChange}
              onValidationChange={vi.fn()}
          />
      );

      // Get initial count
      const initialKeyInputs = screen.getAllByRole('textbox')
          .filter(input => input.classList.contains('json-key-input'));
      const initialCount = initialKeyInputs.length;

      // Click first remove button
      const removeButtons = screen.getAllByTitle('Remove field');
      fireEvent.click(removeButtons[0]);

      // Should have one less field
      const newKeyInputs = screen.getAllByRole('textbox')
          .filter(input => input.classList.contains('json-key-input'));
      expect(newKeyInputs.length).toBe(initialCount - 1);
    });
  });

  // Validation
  describe('Validation', () => {
    it('should show error for invalid number input', () => {
      const mockOnChange = vi.fn();
      const mockOnValidationChange = vi.fn();

      render(
          <JsonBuilder
              value='{"count": 0}'
              onChange={mockOnChange}
              onValidationChange={mockOnValidationChange}
          />
      );

      // Find the type selector and change to number
      const typeSelects = screen.getAllByRole('combobox');
      fireEvent.change(typeSelects[0], { target: { value: 'number' } });

      // Find the value input and enter invalid text
      const valueInputs = screen.getAllByRole('textbox')
          .filter(input => input.classList.contains('json-value-input'));
      fireEvent.change(valueInputs[0], { target: { value: 'not-a-number' } });

      // Should show error message
      expect(screen.getByText('Not a number!')).toBeInTheDocument();

      // Should notify parent that validation failed
      expect(mockOnValidationChange).toHaveBeenCalledWith(false);
    });

    it('should call onValidationChange with true for valid input', () => {
      const mockOnChange = vi.fn();
      const mockOnValidationChange = vi.fn();

      render(
          <JsonBuilder
              value='{"key": "value"}'
              onChange={mockOnChange}
              onValidationChange={mockOnValidationChange}
          />
      );

      // Change a valid value
      const valueInputs = screen.getAllByRole('textbox')
          .filter(input => input.classList.contains('json-value-input'));
      fireEvent.change(valueInputs[0], { target: { value: 'new value' } });

      // Should notify parent that validation passed
      expect(mockOnValidationChange).toHaveBeenCalledWith(true);
    });
  });

  // Type Selection
  describe('Type Selection', () => {
    it('should change input type when selecting different type', () => {
      const mockOnChange = vi.fn();

      render(
          <JsonBuilder
              value='{"flag": "true"}'
              onChange={mockOnChange}
              onValidationChange={vi.fn()}
          />
      );

      // Find the type selector and change to boolean
      const typeSelects = screen.getAllByRole('combobox');
      fireEvent.change(typeSelects[0], { target: { value: 'boolean' } });

      // Should now have a boolean select dropdown
      const allSelects = screen.getAllByRole('combobox');
      const boolSelect = allSelects.find(select =>
                                             select.classList.contains('json-bool-select')
      );

      expect(boolSelect).toBeInTheDocument();
    });
  });

  // JSON Output
  describe('JSON Output', () => {
    it('should call onChange with valid JSON when fields are updated', () => {
      const mockOnChange = vi.fn();

      render(
          <JsonBuilder
              value='{"key": "value"}'
              onChange={mockOnChange}
              onValidationChange={vi.fn()}
          />
      );

      // Change the value
      const valueInputs = screen.getAllByRole('textbox')
          .filter(input => input.classList.contains('json-value-input'));
      fireEvent.change(valueInputs[0], { target: { value: 'updated' } });

      // Should have called onChange with updated JSON
      expect(mockOnChange).toHaveBeenCalled();

      // Get the last call's argument and verify it's valid JSON
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      const jsonString = lastCall[0];

      expect(() => JSON.parse(jsonString)).not.toThrow();
      expect(JSON.parse(jsonString)).toHaveProperty('key', 'updated');
    });
  });
});