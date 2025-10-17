import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Updated import path for the main App component to resolve a module resolution error.
import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}