// Mock Capacitor plugins
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn().mockReturnValue(false)
  }
}));

jest.mock('@capacitor/storage', () => ({
  Storage: {
    get: jest.fn().mockResolvedValue({ value: null }),
    set: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue({ uri: 'file:///test/path' }),
    getUri: jest.fn().mockResolvedValue({ uri: 'file:///test/path' }),
    stat: jest.fn().mockResolvedValue({ size: 1024 }),
    rmdir: jest.fn().mockResolvedValue(undefined)
  },
  Directory: {
    Data: 'DATA'
  }
}));

jest.mock('@capacitor/network', () => ({
  Network: {
    getStatus: jest.fn().mockResolvedValue({ connected: true }),
    addListener: jest.fn().mockReturnValue(1),
    removeAllListeners: jest.fn()
  }
}));

// Mock fetch API
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob())
  })
);

// Mock localStorage
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    },
    writable: true
  });
}

// Mock translation function
global.$t = jest.fn(key => key);
