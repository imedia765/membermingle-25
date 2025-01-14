import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

// Setup a basic DOM environment for tests
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Properly type the window object
declare global {
  interface Window {
    matchMedia: (query: string) => MediaQueryList;
  }
  var localStorage: Storage;
  var sessionStorage: Storage;
}

global.window = dom.window as unknown as Window & typeof globalThis;
global.document = window.document;
global.navigator = {
  userAgent: 'node.js',
} as Navigator;

// Mock localStorage and sessionStorage
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

global.localStorage = mockStorage as Storage;
global.sessionStorage = mockStorage as Storage;

// Mock window.matchMedia
global.window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock fetch API with proper response handling
const mockFetch = vi.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    headers: new Headers(),
    status: 200,
    statusText: "OK",
    clone: () => mockFetch(),
  })
);

global.fetch = mockFetch;
global.Headers = vi.fn(() => ({})) as unknown as typeof Headers;
global.Request = vi.fn(() => ({})) as unknown as typeof Request;
global.Response = vi.fn(() => ({})) as unknown as typeof Response;

// Create a wrapper with providers for testing
export const renderWithProviders = (ui: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Export vi for tests
export { vi };

// Cleanup after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});