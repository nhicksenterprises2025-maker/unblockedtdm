// Compatibility entrypoint retained for historical build gates.
// Live startup is now owned by the deterministic boot orchestrator, which calls
// this bridge explicitly so Career cannot race the earlier UI/runtime phases.
export function loadCareerRuntime() {
  return import('./phase211-runtime.js');
}
