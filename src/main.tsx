import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Content Protection: Prevent copying non-link/input content
document.addEventListener('copy', (e) => {
  const selection = window.getSelection();
  if (!selection) return;
  
  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  if (!range) return;

  const container = range.commonAncestorContainer;
  const target = container.nodeType === 3 ? container.parentElement : container as HTMLElement;
  
  const isAllowed = (el: HTMLElement | null): boolean => {
    if (!el) return false;
    if (['A', 'INPUT', 'TEXTAREA'].includes(el.tagName)) return true;
    return isAllowed(el.parentElement);
  };

  if (!isAllowed(target)) {
    e.preventDefault();
  }
});

// Prevent Right Click
document.addEventListener('contextmenu', (e) => {
  const target = e.target as HTMLElement;
  if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
  e.preventDefault();
});

// Prevent common Inspect/Copy shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+C, Ctrl+U, Ctrl+S, Ctrl+Shift+I, F12
  if (
    (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's')) ||
    (e.ctrlKey && e.shiftKey && e.key === 'I') ||
    e.key === 'F12'
  ) {
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA'].includes(target.tagName) && e.key === 'c') return;
    e.preventDefault();
  }
});

