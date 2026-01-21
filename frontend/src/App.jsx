import { useState, useEffect } from 'react';
import JsonBuilder from './JsonBuilder';
import './App.css';

const API_URL = '/settings';

function App() {
  const [settings, setSettings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [jsonInput, setJsonInput] = useState('{\n  "key": "value"\n}');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' or 'raw'
  const [isJsonValid, setIsJsonValid] = useState(true);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch settings
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

  useEffect(() => {
    fetchSettings();
  }, []);

  // Validate JSON
  const validateJson = (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  // Search by ID (GET /settings/{uid})
  const handleSearch = async () => {
    if (!searchId.trim()) {
      setSearchError('Please enter an ID');
      return;
    }
    setSearchError('');
    setSearchResult(null);

    try {
      const res = await fetch(`${API_URL}/${searchId.trim()}`);

      if (res.status === 404) {
        setSearchError(`Error 404: Settings with ID "${searchId}" not found`);
        return;
      }

      if (!res.ok) {
        setSearchError(`Error ${res.status}: Failed to fetch settings`);
        return;
      }

      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      setSearchError('Network error: Failed to connect to server');
    }
  };

  // Create new settings
  const handleCreate = async () => {
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

  // Update settings (PUT /settings/{uid})
  const handleUpdate = async () => {
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

      if (res.status === 404) {
        setError(`Error 404: Settings with ID "${editingId}" not found. It may have been deleted.`);
        setEditingId(null);
        setJsonInput('{\n  "key": "value"\n}');
        fetchSettings(pagination.page);
        return;
      }

      if (!res.ok) {
        setError(`Error ${res.status}: Failed to update settings`);
        return;
      }

      setEditingId(null);
      setJsonInput('{\n  "key": "value"\n}');
      setSuccess('Updated successfully!');
      fetchSettings(pagination.page);
    } catch (err) {
      setError('Network error: Failed to update settings');
    }
  };

  // Delete settings
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (res.status === 204) {
        setSuccess('Deleted successfully!');
      }
      // Clear search result if the deleted item was the searched one
      if (searchResult && searchResult.id === id) {
        setSearchResult(null);
        setSearchId('');
      }
      fetchSettings(pagination.page);
    } catch (err) {
      setError('Failed to delete settings');
    }
  };

  // Edit settings
  const handleEdit = (item) => {
    setEditingId(item.id);
    setJsonInput(JSON.stringify(item.data, null, 2));
    setError('');
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingId(null);
    setJsonInput('{\n  "key": "value"\n}');
    setError('');
  };

  return (
      <div className="container">
        <h1>Settings Management</h1>

        {/* Search by ID Section */}
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
            {searchResult && (
                <button
                    onClick={() => { setSearchResult(null); setSearchId(''); }}
                    className="btn-secondary"
                >
                  Clear
                </button>
            )}
          </div>

          {searchError && (
              <div className="error">
                <strong> {searchError}</strong>
              </div>
          )}

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
                    <button onClick={() => handleDelete(searchResult.id)} className="btn-delete">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* JSON Editor */}
        <div className="editor-section">
          <div className="editor-header">
            <h2>{editingId ? `Edit Settings (ID: ${editingId})` : 'Create New Settings'}</h2>
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

          {error && <div className="error"><strong>️ {error}</strong></div>}
          {success && <div className="success"><strong>✓ {success}</strong></div>}

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

          {editorMode === 'raw' && !validateJson(jsonInput) && jsonInput && (
              <div className="error"><strong>️ Invalid JSON format</strong></div>
          )}

          <div className="button-group">
            {editingId ? (
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

        {/* Settings List */}
        <div className="list-section">
          <h2>All Settings (Page {pagination.page} of {pagination.totalPages})</h2>
          <p className="total-count">Total: {pagination.total || 0} items</p>

          {loading ? (
              <p>Loading...</p>
          ) : settings.length === 0 ? (
              <p className="empty">No settings found. Create one above!</p>
          ) : (
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
                              <button onClick={() => handleDelete(item.id)} className="btn-delete">
                                Delete
                              </button>
                            </div>
                          </li>
                      ))}
                    </ul>

                    {/* Pagination */}
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