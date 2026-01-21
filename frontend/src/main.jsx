/**
 * main.jsx - Application Entry Point
 *
 * This is the entry point for the React application.
 * It mounts the root App component to the DOM.
 *
 * React.StrictMode is enabled to:
 *   - Identify components with unsafe lifecycles
 *   - Warn about deprecated API usage
 *   - Detect unexpected side effects
 *   - (Only runs in development mode)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Create root and render the App component
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
);