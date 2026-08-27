// Skirmish Arena modern UI bootstrap.
// This is deliberately a real ES-module entrypoint so packaged Electron builds
// do not depend on the legacy classic-script dynamic import chain to reach the
// current front end. Imports are side-effect modules and are de-duplicated by
// the browser module loader if debug-tuning.js has already requested them.

import './flow-v18.js';
import './phase4-runtime.js';
import './phase5-runtime.js';
import './phase6-runtime.js';
import './phase7-runtime.js';
import './phase8-runtime.js';
import './phase9-runtime.js';
import './phase10-runtime.js';
import './phase2011-runtime.js';
import './phase2012-runtime.js';
import './phase2013-runtime.js';
import './phase2014-runtime.js';
import './phase221-runtime.js';
import './phase2211-runtime.js';

document.documentElement.dataset.skirmishUiBoot = '2.21.1';
document.body.classList.add('skirmish-ui-booted');
window.dispatchEvent(new CustomEvent('skirmish:ui-booted', { detail: { version: '2.21.1' } }));
