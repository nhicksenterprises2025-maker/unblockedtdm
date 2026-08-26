// Compatibility entrypoint retained for historical build gates.
// The active Career system lives in phase211-runtime.js so only one match-complete
// listener can award account XP.
import('./phase211-runtime.js').catch((error) => console.error('2.1.1 account Career runtime failed to load', error));
