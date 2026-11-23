// Copies the web app into www/, which Capacitor packages into the iOS and Android apps.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of ['index.html', 'privacy.html', 'config.js', 'app.js', 'styles.css', 'data', 'icons']) cpSync(f, 'www/' + f, { recursive: true });
console.log('Built www/');
