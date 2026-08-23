const fs = require('fs');
const path = require('path');

const dirs = ['models', 'controllers', 'routes', 'services', 'middleware', 'config', 'utils'];
let passed = 0;
let failed = 0;

console.log('🔍 Testing all backend modules...\n');

dirs.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath);
  files.forEach((f) => {
    if (f.endsWith('.js')) {
      try {
        require(path.join(dirPath, f));
        console.log(`✅ [OK] ${dir}/${f}`);
        passed++;
      } catch (e) {
        console.error(`❌ [ERR] ${dir}/${f} -> ${e.message}`);
        failed++;
      }
    }
  });
});

console.log(`\n=============================`);
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log(`=============================\n`);

if (failed > 0) process.exit(1);
