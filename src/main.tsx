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

