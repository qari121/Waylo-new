// ─── REALLY FIRST LINE ────────────────────────────────────────────────────
console.log('[BOOT] top-of-index, Promise is', global.Promise);

// Fallback polyfill (makes Promise safe no matter what overwrote it)
if (typeof global.Promise === 'undefined') {
  global.Promise = require('promise/setimmediate');  //  npm i promise  (tiny lib)
  console.log('[BOOT] polyfilled Promise with', global.Promise?.name);
}// leave this as the first statement
import 'expo-router/entry'; 