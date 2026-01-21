import { useState } from 'react';
import './JsonBuilder.css';

function JsonBuilder({ value, onChange, onValidationChange }) {
  // Parse initial value or use default
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
      return [{ id: 0, key: 'key', value: 'value', type: 'string' }];
    }
  };

  const [fields, setFields] = useState(parseInitialFields);
  const [nextId, setNextId] = useState(fields.length);

  // Helper to validate JSON string
  const isValidJson = (str) => {
    if (!str) return true;
    try { JSON.parse(str); return true; } catch { return false; }
  };

  // Check if all fields are valid
  const checkErrors = (fieldsToCheck) => {
    return fieldsToCheck.some(field => {
      if (field.type === 'number' && field.value && isNaN(Number(field.value))) {
        return true;
      }
      if (field.type === 'object' && field.value && !isValidJson(field.value)) {
        return true;
      }
      return false;
    });
  };

  // Convert fields to JSON and notify parent
  const updateParent = (newFields) => {
    const hasError = checkErrors(newFields);

    // Notify parent about validation status
    if (onValidationChange) {
      onValidationChange(!hasError);
    }

    // Only update JSON if valid
    if (hasError) return;

    const obj = {};
    newFields.forEach(field => {
      if (field.key.trim()) {
        let val = field.value;
        if (field.type === 'number') {
          val = Number(field.value) || 0;
        } else if (field.type === 'boolean') {
          val = field.value === 'true';
        } else if (field.type === 'object') {
          try { val = JSON.parse(field.value); } catch { val = {}; }
        }
        obj[field.key] = val;
      }
    });

    onChange(JSON.stringify(obj, null, 2));
  };

  // Add new field
  const addField = () => {
    const newFields = [...fields, { id: nextId, key: '', value: '', type: 'string' }];
    setFields(newFields);
    setNextId(nextId + 1);
    updateParent(newFields);
  };

  // Remove field
  const removeField = (id) => {
    const newFields = fields.filter(f => f.id !== id);
    setFields(newFields);
    updateParent(newFields);
  };

  // Update field
  const updateField = (id, property, newValue) => {
    const newFields = fields.map(f =>
                                     f.id === id ? { ...f, [property]: newValue } : f
    );
    setFields(newFields);
    updateParent(newFields);
  };

  return (
      <div className="json-builder">
        <div className="json-bracket">{"{"}</div>

        <div className="json-fields">
          {fields.map((field, index) => (
              <div key={field.id} className="json-row">
                <span className="json-indent"></span>

                {/* Key input */}
                <span className="json-quote">"</span>
                <input
                    type="text"
                    className="json-key-input"
                    value={field.key}
                    onChange={(e) => updateField(field.id, 'key', e.target.value)}
                    placeholder="key"
                />
                <span className="json-quote">"</span>

                <span className="json-colon">:</span>

                {/* Type selector */}
                <select
                    className="json-type-select"
                    value={field.type}
                    onChange={(e) => updateField(field.id, 'type', e.target.value)}
                >
                  <option value="string">text</option>
                  <option value="number">number</option>
                  <option value="boolean">true/false</option>
                  <option value="object">JSON</option>
                </select>

                {/* Value input based on type */}
                {field.type === 'string' && (
                    <>
                      <span className="json-quote">"</span>
                      <input
                          type="text"
                          className="json-value-input"
                          value={field.value}
                          onChange={(e) => updateField(field.id, 'value', e.target.value)}
                          placeholder="value"
                      />
                      <span className="json-quote">"</span>
                    </>
                )}

                {field.type === 'number' && (
                    <>
                      <input
                          type="text"
                          className={`json-value-input json-number ${field.value && isNaN(Number(field.value)) ? 'input-error' : ''}`}
                          value={field.value}
                          onChange={(e) => updateField(field.id, 'value', e.target.value)}
                          placeholder="0"
                      />
                      {field.value && isNaN(Number(field.value)) && (
                          <span className="field-error">Not a number!</span>
                      )}
                    </>
                )}

                {field.type === 'boolean' && (
                    <select
                        className="json-bool-select"
                        value={field.value}
                        onChange={(e) => updateField(field.id, 'value', e.target.value)}
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                )}

                {field.type === 'object' && (
                    <>
                      <input
                          type="text"
                          className={`json-value-input json-object ${field.value && !isValidJson(field.value) ? 'input-error' : ''}`}
                          value={field.value}
                          onChange={(e) => updateField(field.id, 'value', e.target.value)}
                          placeholder='{"nested": "object"}'
                      />
                      {field.value && !isValidJson(field.value) && (
                          <span className="field-error">Invalid JSON!</span>
                      )}
                    </>
                )}

                {/* Comma (not on last item) */}
                <span className="json-comma">
              {index < fields.length - 1 ? ',' : ''}
            </span>

                {/* Remove button */}
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

        <div className="json-bracket">{"}"}</div>

        <button className="json-add-btn" onClick={addField}>
          + Add Field
        </button>
      </div>
  );
}

export default JsonBuilder;