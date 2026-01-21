/**
 * JsonBuilder.jsx - Visual JSON Editor Component
 *
 * A block-based JSON editor inspired by Scratch/Code.org.
 * Users can only edit values, not JSON syntax (brackets, quotes, colons).
 *
 * Features:
 *   - Add/remove key-value fields dynamically
 *   - Type selector: text, number, true/false, JSON (nested objects)
 *   - Real-time validation with error messages
 *   - Prevents invalid data from being created
 *
 * Props:
 *   @param {string} value - Initial JSON string to parse
 *   @param {function} onChange - Callback when valid JSON is produced
 *   @param {function} onValidationChange - Callback with validation status (true/false)
 */

import { useState } from 'react';
import './JsonBuilder.css';

function JsonBuilder({ value, onChange, onValidationChange }) {

  // Initialization
  /**
   * Parses the initial JSON string into field objects.
   * Each field has: id, key, value, type
   *
   * @returns {Array} Array of field objects
   */
  const parseInitialFields = () => {
    try {
      const parsed = JSON.parse(value);
      return Object.entries(parsed).map(([key, val], index) => ({
        id: index,
        key,
        value: typeof val === 'object' ? JSON.stringify(val) : String(val),
        type: typeof val === 'object' ? 'object' :
              typeof val === 'number' ? 'number' :
              typeof val === 'boolean' ? 'boolean' : 'string'
      }));
    } catch {
      // Default field if parsing fails
      return [{ id: 0, key: 'key', value: 'value', type: 'string' }];
    }
  };

  // State
  const [fields, setFields] = useState(parseInitialFields);
  const [nextId, setNextId] = useState(fields.length);

  // Validation Functions=
  /**
   * Checks if a string is valid JSON
   *
   * @param {string} str - String to validate
   * @returns {boolean} True if valid JSON or empty
   */
  const isValidJson = (str) => {
    if (!str) return true;  // Empty is valid (will default to {})
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Checks if any fields have validation errors
   *
   * @param {Array} fieldsToCheck - Array of field objects
   * @returns {boolean} True if there are errors
   */
  const checkErrors = (fieldsToCheck) => {
    return fieldsToCheck.some(field => {
      // Number type must contain a valid number
      if (field.type === 'number' && field.value && isNaN(Number(field.value))) {
        return true;
      }
      // Object/JSON type must be valid JSON syntax
      if (field.type === 'object' && field.value && !isValidJson(field.value)) {
        return true;
      }
      return false;
    });
  };

  // Parent Communication
  /**
   * Converts fields to JSON and notifies parent component.
   * Only sends valid JSON to parent; invalid data is blocked.
   *
   * @param {Array} newFields - Updated array of field objects
   */
  const updateParent = (newFields) => {
    const hasError = checkErrors(newFields);

    // Always notify parent about validation status
    // This enables/disables the Create/Update button
    if (onValidationChange) {
      onValidationChange(!hasError);
    }

    // Don't update JSON if there are errors
    if (hasError) return;

    // Build the JSON object from fields
    const obj = {};
    newFields.forEach(field => {
      if (field.key.trim()) {
        let val = field.value;

        // Convert value based on type
        if (field.type === 'number') {
          val = Number(field.value) || 0;
        } else if (field.type === 'boolean') {
          val = field.value === 'true';
        } else if (field.type === 'object') {
          try {
            val = JSON.parse(field.value);
          } catch {
            val = {};
          }
        }

        obj[field.key] = val;
      }
    });

    // Send formatted JSON to parent
    onChange(JSON.stringify(obj, null, 2));
  };

  // Field Management
  /**
   * Adds a new empty field to the editor
   */
  const addField = () => {
    const newFields = [...fields, {
      id: nextId,
      key: '',
      value: '',
      type: 'string'
    }];
    setFields(newFields);
    setNextId(nextId + 1);
    updateParent(newFields);
  };

  /**
   * Removes a field from the editor
   *
   * @param {number} id - Unique ID of the field to remove
   */
  const removeField = (id) => {
    const newFields = fields.filter(f => f.id !== id);
    setFields(newFields);
    updateParent(newFields);
  };

  /**
   * Updates a specific property of a field
   *
   * @param {number} id - Unique ID of the field
   * @param {string} property - Property to update ('key', 'value', or 'type')
   * @param {string} newValue - New value for the property
   */
  const updateField = (id, property, newValue) => {
    const newFields = fields.map(f =>
                                     f.id === id ? { ...f, [property]: newValue } : f
    );
    setFields(newFields);
    updateParent(newFields);
  };

  // Render
  return (
      <div className="json-builder">
        {/* Opening bracket */}
        <div className="json-bracket">{"{"}</div>

        {/* Field rows */}
        <div className="json-fields">
          {fields.map((field, index) => (
              <div key={field.id} className="json-row">
                {/* Indentation */}
                <span className="json-indent"></span>

                {/* Key input with quotes */}
                <span className="json-quote">"</span>
                <input
                    type="text"
                    className="json-key-input"
                    value={field.key}
                    onChange={(e) => updateField(field.id,
                                                 'key', e.target.value)}
                    placeholder="key"
                />
                <span className="json-quote">"</span>

                {/* Colon separator */}
                <span className="json-colon">:</span>

                {/* Type selector dropdown */}
                <select
                    className="json-type-select"
                    value={field.type}
                    onChange={(e) => updateField(field.id,
                                                 'type', e.target.value)}
                >
                  <option value="string">text</option>
                  <option value="number">number</option>
                  <option value="boolean">true/false</option>
                  <option value="object">JSON</option>
                </select>

                {/* Value input - changes based on type */}

                {/* String type: text input with quotes */}
                {field.type === 'string' && (
                    <>
                      <span className="json-quote">"</span>
                      <input
                          type="text"
                          className="json-value-input"
                          value={field.value}
                          onChange={(e) => updateField(field.id,
                                                       'value', e.target.value)}
                          placeholder="value"
                      />
                      <span className="json-quote">"</span>
                    </>
                )}

                {/* Number type: text input with validation */}
                {field.type === 'number' && (
                    <>
                      <input
                          type="text"
                          className={`json-value-input json-number ${
                 field.value && isNaN(Number(field.value)) ? 'input-error' : ''
                          }`}
                          value={field.value}
                          onChange={(e) => updateField(field.id,
                                                       'value', e.target.value)}
                          placeholder="0"
                      />
                      {/* Error message for invalid numbers */}
                      {field.value && isNaN(Number(field.value)) && (
                          <span className="field-error">Not a number!</span>
                      )}
                    </>
                )}

                {/* Boolean type: dropdown selector */}
                {field.type === 'boolean' && (
                    <select
                        className="json-bool-select"
                        value={field.value}
                        onChange={(e) => updateField(field.id,
                                                     'value', e.target.value)}
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                )}

                {/* Object/JSON type: text input with JSON validation */}
                {field.type === 'object' && (
                    <>
                      <input
                          type="text"
                          className={`json-value-input json-object ${
                 field.value && !isValidJson(field.value) ? 'input-error' : ''
                          }`}
                          value={field.value}
                          onChange={(e) => updateField(field.id,
                                                       'value', e.target.value)}
                          placeholder='{"nested": "object"}'
                      />
                      {/* Error message for invalid JSON */}
                      {field.value && !isValidJson(field.value) && (
                          <span className="field-error">Invalid JSON!</span>
                      )}
                    </>
                )}

                {/* Comma after each field except the last */}
                <span className="json-comma">
              {index < fields.length - 1 ? ',' : ''}
            </span>

                {/* Remove field button */}
                <button
                    className="json-remove-btn"
                    onClick={() => removeField(field.id)}
                    title="Remove field"
                >
                  ×
                </button>
              </div>
          ))}
        </div>

        {/* Closing bracket */}
        <div className="json-bracket">{"}"}</div>

        {/* Add new field button */}
        <button className="json-add-btn" onClick={addField}>
          + Add Field
        </button>
      </div>
  );
}

export default JsonBuilder;