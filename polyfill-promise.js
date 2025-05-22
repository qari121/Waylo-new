/* Ensures global.Promise is ALWAYS a usable constructor */
if (typeof global.Promise !== 'function') {
    // Small, standards-compliant polyfill (2 KB gzipped)
    global.Promise = require('promise/setimmediate');
  } else {
    // Freeze it so later overwrites are ignored
    const RealPromise = global.Promise;
    Object.defineProperty(global, 'Promise', {
      configurable: false,
      enumerable: true,
      get: () => RealPromise,
      set: val => {
        console.warn('[polyfill-promise] blocked overwrite of global.Promise');
      },
    });
  }
  