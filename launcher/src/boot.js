const { app } = require('electron');
const path = require('node:path');

// Preserve the existing launcher state/install data while the visible Windows
// product branding transitions from the legacy project name to Skirmish Arena.
app.setPath('userData', path.join(app.getPath('appData'), 'UnblockedTDM Launcher'));
app.setName('Skirmish Arena Launcher');

require('./main.js');
