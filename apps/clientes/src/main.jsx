import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  CssBaseline,
  ThemeProvider
} from '@mui/material';

import App from './App.jsx';
import theme from './theme.js';

import './styles.css';

const root =
  document.getElementById('root');

ReactDOM
  .createRoot(root)
  .render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );