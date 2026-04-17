import { Window } from 'happy-dom';

const window = new Window({ url: 'http://localhost' });

// happy-dom 20.x does not expose JS built-ins (SyntaxError, TypeError, etc.) on the Window object,
// but querySelector's SelectorParser calls `new this.window.SyntaxError(...)`. Patch them in so
// querySelectorAll / querySelector work correctly in tests.
const windowAny = window as unknown as Record<string, unknown>;
if (!windowAny.SyntaxError) windowAny.SyntaxError = SyntaxError;
if (!windowAny.TypeError) windowAny.TypeError = TypeError;
if (!windowAny.RangeError) windowAny.RangeError = RangeError;

// Register DOM globals that @testing-library/react needs
for (const key of Object.getOwnPropertyNames(window)) {
  if (!(key in globalThis)) {
    Object.defineProperty(globalThis, key, {
      value: (window as unknown as Record<string, unknown>)[key],
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
