const fs = require('fs');
const path = require('path');

console.log("=== Neptune Logistics Build Step ===");

// ══════════════════════════════════════════════════════════════════════════
// Automated HTML Cache-Busting Pipeline
// ══════════════════════════════════════════════════════════════════════════
// Generates a unique build version string and dynamically injects it as a
// query parameter (?v=timestamp) to all stylesheet and script imports across 
// all HTML files. This guarantees users load fresh CSS/JS immediately on redeployment.

console.log("Starting Automated HTML Cache-Busting Pipeline...");
const buildVersion = Date.now().toString();
console.log(`Using cache-buster build token: ?v=${buildVersion}`);

function getHtmlFiles(dir, files_ = []) {
  if (!fs.existsSync(dir)) return files_;
  const files = fs.readdirSync(dir);
  for (const i in files) {
    const name = path.join(dir, files[i]);
    if (fs.statSync(name).isDirectory()) {
      // Exclude system, dependency, and configuration folders
      if (!name.includes('node_modules') && !name.includes('.git') && !name.includes('.vercel')) {
        getHtmlFiles(name, files_);
      }
    } else if (name.endsWith('.html')) {
      files_.push(name);
    }
  }
  return files_;
}

try {
  const htmlFiles = getHtmlFiles(__dirname);
  console.log(`Scanning ${htmlFiles.length} HTML files for asset imports...`);
  
  htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let replaced = false;

    // Matches href/src pointing to css/, js/, or assets/favicon-wave.png with optional leading relative paths (./ or ../)
    // e.g., href="css/navbar.css", href="../css/navbar.css?v=1.0", href="assets/favicon-wave.png"
    const newContent = content.replace(
      /((?:href|src)=["'])((?:\.\.\/|\.\/)?(?:(?:css|js)\/[^"'\s?]+|assets\/favicon-wave\.png))(?:\?[^"'\s]*)?(["'])/g,
      (match, prefix, pathAndName, suffix) => {
        replaced = true;
        return `${prefix}${pathAndName}?v=${buildVersion}${suffix}`;
      }
    );

    if (replaced) {
      fs.writeFileSync(file, newContent, 'utf-8');
      console.log(`  - Injected cache-buster: ${path.relative(__dirname, file)}`);
    }
  });
  console.log("Automated Cache-Busting completed successfully!");
} catch (err) {
  console.error("ERROR running HTML Cache-Buster:", err);
}

console.log("=====================================");
