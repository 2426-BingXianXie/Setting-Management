/**
 * App.jsx - Main Application Component
 *
 * The root component for the Settings Management System UI.
 * Provides functionality to:
 *   - Search for settings by ID
 *   - Create new settings (Visual or Raw JSON editor)
 *   - View all settings with pagination
 *   - Edit and delete existing settings
 *   - Display HTTP error codes (404, etc.) to users
 */

import { useState, useEffect } from 'react';
import JsonBuilder from './JsonBuilder';
import './App.css';

// API base URL - proxied through Vite to backend
const API_URL = '/settings';

function App() {
  // State Management
  // Settings list and pagination
  const [settings, setSettings] = useState([]);
  const [pagination, setPagination] = useState({
                                                 page: 1, totalPages: 1});

  // Editor state
  const [jsonInput, setJsonInput] = useState('{\n  "key": "value"\n}');
  const [editingId, setEditingId] = useState(null);
  const [editorMode, setEditorMode] = useState('visual');
  const [isJsonValid, setIsJsonValid] = useState(true);

  // Messages and loading
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Search functionality
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Effects
  /**
   * Auto-clear success messages after 5 seconds
   */
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  /**
   * Fetch settings on component mount
   */
  useEffect(() => {
    fetchSettings();
  }, []);

  // API Functions
  /**
   * Fetches paginated settings from the API
   * GET /settings?page={page}&limit=5
   *
   * @param {number} page - Page number to fetch (default: 1)
   */
  const fetchSettings = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?page=${page}&limit=5`);
      const data = await res.json();
      setSettings(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validates if a string is valid JSON
   *
   * @param {string} str - String to validate
   * @returns {boolean} True if valid JSON
   */
  const validateJson = (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Searches for a settings object by ID
   * GET /settings/{uid}
   *
   * Displays HTTP 404 error if not found
   */
  const handleSearch = async () => {
    // Validate input
    if (!searchId.trim()) {
      setSearchError('Please enter an ID');
      return;
    }

    setSearchError('');
    setSearchResult(null);

    try {
      const res = await fetch(`${API_URL}/${searchId.trim()}`);

      // Handle 404 Not Found - display to user
      if (res.status === 404) {
        setSearchError(`Error 404: Settings with ID "${searchId}" not found`);
        return;
      }

      // Handle other errors
      if (!res.ok) {
        setSearchError(`Error ${res.status}: Failed to fetch settings`);
        return;
      }

      // Success - display found settings
      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      setSearchError('Network error: Failed to connect to server');
    }
  };

  /**
   * Creates a new settings object
   * POST /settings
   */
  const handleCreate = async () => {
    // Validate JSON before sending
    if (!validateJson(jsonInput)) {
      setError('Invalid JSON format');
      return;
    }

    setError('');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonInput
      });

      if (res.ok) {
        const data = await res.json();
        setJsonInput('{\n  "key": "value"\n}');
        setSuccess(`Created successfully! ID: ${data.id}`);
        fetchSettings(pagination.page);
      }
    } catch (err) {
      setError('Failed to create settings');
    }
  };

  /**
   * Updates an existing settings object
   * PUT /settings/{uid}
   *
   * Displays HTTP 404 error if the item was deleted
   */
  const handleUpdate = async () => {
    // Validate JSON before sending
    if (!validateJson(jsonInput)) {
      setError('Invalid JSON format');
      return;
    }

    setError('');

    try {
      const res = await fetch(`${API_URL}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: jsonInput
      });

      // Handle 404 - item may have been deleted
      if (res.status === 404) {
        setError(`Error 404: Settings with ID "${editingId}" not found. It may have been deleted.`);
        setEditingId(null);
        setJsonInput('{\n  "key": "value"\n}');
        fetchSettings(pagination.page);
        return;
      }

      // Handle other errors
      if (!res.ok) {
        setError(`Error ${res.status}: Failed to update settings`);
        return;
      }

      // Success - reset editor and refresh
      setEditingId(null);
      setJsonInput('{\n  "key": "value"\n}');
      setSuccess('Updated successfully!');
      fetchSettings(pagination.page);
    } catch (err) {
      setError('Network error: Failed to update settings');
    }
  };

  /**
   * Deletes a settings object
   * DELETE /settings/{uid}
   *
   * Shows confirmation dialog before deleting.
   * Also clears search result if the deleted item was displayed.
   *
   * @param {string} id - UUID of the settings to delete
   */
  const handleDelete = async (id) => {
    // Confirm before deleting
    if (!confirm('Are you sure you want to delete this?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

      if (res.status === 204) {
        setSuccess('Deleted successfully!');
      }

      // Clear search result if we deleted the searched item
      if (searchResult && searchResult.id === id) {
        setSearchResult(null);
        setSearchId('');
      }

      fetchSettings(pagination.page);  // Refresh list
    } catch (err) {
      setError('Failed to delete settings');
    }
  };

  // UI Action Handlers
  /**
   * Enters edit mode for a settings object
   * Populates the editor with the item's data
   *
   * @param {Object} item - Settings object to edit
   */
  const handleEdit = (item) => {
    setEditingId(item.id);
    setJsonInput(JSON.stringify(item.data, null, 2));
    setError('');
  };

  /**
   * Cancels edit mode and resets the editor
   */
  const handleCancel = () => {
    setEditingId(null);
    setJsonInput('{\n  "key": "value"\n}');
    setError('');
  };

  // Render
  return (
      <div className="container">
        <h1>Settings Management</h1>

        {/* Search Section */}
        <div className="search-section">
          <h2>Search by ID</h2>
          <div className="search-box">
            <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter settings ID (e.g., 3bd7923c-...)"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="btn-primary">
              Search
            </button>
            {/* Show Clear button only when there's a result */}
            {searchResult && (
                <button
                    onClick={() => { setSearchResult(null); setSearchId(''); }}
                    className="btn-secondary"
                >
                  Clear
                </button>
            )}
          </div>

          {/* Search error message */}
          {searchError && (
              <div className="error">
                <strong>⚠️ {searchError}</strong>
              </div>
          )}

          {/* Search result display */}
          {searchResult && (
              <div className="search-result">
                <h3>Found Settings:</h3>
                <div className="result-card">
                  <div className="item-header">
                    <span className="item-id">ID: {searchResult.id}</span>
                    <span className="item-date">
                  Created: {new Date(searchResult.createdAt).toLocaleString()}
                </span>
                  </div>
                  <pre className="item-data">
                {JSON.stringify(searchResult.data, null, 2)}
              </pre>
                  <div className="item-actions">
                    <button onClick={() => handleEdit(searchResult)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(searchResult.id)}
                            className="btn-delete">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* Editor Section */}
        <div className="editor-section">
          <div className="editor-header">
            {/* Title changes based on create/edit mode */}
            <h2>{editingId ? `Edit Settings (ID: ${editingId})` : 'Create New Settings'}</h2>

            {/* Toggle between Visual and Raw JSON modes */}
            <div className="editor-mode-toggle">
              <button
                  className={editorMode === 'visual' ? 'active' : ''}
                  onClick={() => setEditorMode('visual')}
              >
                Visual
              </button>
              <button
                  className={editorMode === 'raw' ? 'active' : ''}
                  onClick={() => setEditorMode('raw')}
              >
                Raw JSON
              </button>
            </div>
          </div>

          {/* Error and success messages */}
          {error && <div className="error"><strong>⚠️ {error}</strong></div>}
          {success && <div className="success"><strong>✓ {success}</strong></div>}

          {/* Conditional rendering: Visual editor or Raw textarea */}
          {editorMode === 'visual' ? (
              <JsonBuilder
                  value={jsonInput}
                  onChange={setJsonInput}
                  onValidationChange={setIsJsonValid}
              />
          ) : (
               <textarea
                   value={jsonInput}
                   onChange={(e) => setJsonInput(e.target.value)}
                   placeholder="Enter JSON data..."
                   rows={8}
                   className={!validateJson(jsonInput) && jsonInput ? 'invalid' : ''}
               />
           )}

          {/* Show validation error for raw mode */}
          {editorMode === 'raw' && !validateJson(jsonInput) && jsonInput && (
              <div className="error"><strong>⚠️ Invalid JSON format</strong></div>
          )}

          {/* Action buttons */}
          <div className="button-group">
            {editingId ? (
                // Edit mode: Update and Cancel buttons
                <>
                  <button
                      onClick={handleUpdate}
                      className="btn-primary"
                      disabled={editorMode === 'visual' && !isJsonValid}
                  >
                    Update
                  </button>
                  <button onClick={handleCancel} className="btn-secondary">
                    Cancel
                  </button>
                </>
            ) : (
                 // Create mode: Create button only
                 <button
                     onClick={handleCreate}
                     className="btn-primary"
                     disabled={editorMode === 'visual' && !isJsonValid}
                 >
                   Create
                 </button>
             )}
          </div>
        </div>

        {/* Settings List Section */}
        <div className="list-section">
          <h2>All Settings (Page {pagination.page} of {pagination.totalPages})</h2>
          <p className="total-count">Total: {pagination.total || 0} items</p>

          {loading ? (
              // Loading state
              <p>Loading...</p>
          ) : settings.length === 0 ? (
              // Empty state
              <p className="empty">No settings found. Create one above!</p>
          ) : (
                  // Settings list with pagination
                  <>
                    <ul className="settings-list">
                      {settings.map((item) => (
                          <li key={item.id} className={editingId === item.id ? 'editing' : ''}>
                            <div className="item-header">
                              <span className="item-id">ID: {item.id}</span>
                              <span className="item-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                            </div>
                            <pre className="item-data">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                            <div className="item-actions">
                              <button onClick={() => handleEdit(item)} className="btn-edit">
                                Edit
                              </button>
                              <button onClick={() => handleDelete(item.id)}
                                      className="btn-delete">
                                Delete
                              </button>
                            </div>
                          </li>
                      ))}
                    </ul>

                    {/* Pagination controls */}
                    <div className="pagination">
                      <button
                          onClick={() => fetchSettings(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                      >
                        Previous
                      </button>
                      <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
                      <button
                          onClick={() => fetchSettings(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </>
              )}
        </div>
      </div>
  );
}

export default App;