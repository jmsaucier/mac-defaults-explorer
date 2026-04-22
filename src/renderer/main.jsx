const React = require('react');
const { createRoot } = require('react-dom/client');
const { App } = require('./App');

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(React.createElement(App));
