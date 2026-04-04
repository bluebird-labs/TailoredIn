import { Window } from 'happy-dom';

const window = new Window({ url: 'http://localhost' });

// Register DOM globals that @testing-library/react needs
for (const key of Object.getOwnPropertyNames(window)) {
  if (!(key in globalThis)) {
    Object.defineProperty(globalThis, key, {
      value: (window as Record<string, unknown>)[key],
      writable: true,
      configurable: true
    });
  }
}

// Ensure critical globals are always set
Object.defineProperty(globalThis, 'document', { value: window.document, writable: true, configurable: true });
Object.defineProperty(globalThis, 'window', { value: window, writable: true, configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, writable: true, configurable: true });
Object.defineProperty(globalThis, 'HTMLElement', { value: window.HTMLElement, writable: true, configurable: true });
