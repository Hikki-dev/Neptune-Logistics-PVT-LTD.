const fs = require('fs');
const path = require('path');

console.log("=== Neptune Logistics Build Step ===");

// ══════════════════════════════════════════════════════════════════════════
// 1. Component Synchronization Pipeline
// ══════════════════════════════════════════════════════════════════════════
// Ensures .partial and .html component files stay in 100% sync
try {
  const navbarPartial = path.join(__dirname, 'components/navbar.partial');
  const navbarHtml = path.join(__dirname, 'components/navbar.html');
  if (fs.existsSync(navbarPartial)) {
    fs.copyFileSync(navbarPartial, navbarHtml);
    console.log("  - Synchronized components/navbar.partial -> components/navbar.html");
  }

  const footerPartial = path.join(__dirname, 'components/footer.partial');
  const footerHtml = path.join(__dirname, 'components/footer.html');
  if (fs.existsSync(footerPartial)) {
    fs.copyFileSync(footerPartial, footerHtml);
    console.log("  - Synchronized components/footer.partial -> components/footer.html");
  }
} catch (err) {
  console.error("ERROR syncing component files:", err);
}

// ══════════════════════════════════════════════════════════════════════════
// 2. Automated Cache-Busting Pipeline
// ══════════════════════════════════════════════════════════════════════════
console.log("Starting Automated HTML Cache-Busting Pipeline...");
const buildVersion = Date.now().toString();
console.log(`Using cache-buster build token: ?v=${buildVersion}`);

// Update loaders with buildVersion token
try {
  const navLoaderPath = path.join(__dirname, 'js/navbar-loader.js');
  if (fs.existsSync(navLoaderPath)) {
    let navLoader = fs.readFileSync(navLoaderPath, 'utf-8');
    navLoader = navLoader.replace(/const token = '[^']*';/, `const token = 'v=${buildVersion}';`);
    fs.writeFileSync(navLoaderPath, navLoader, 'utf-8');
    console.log("  - Updated js/navbar-loader.js token");
  }

  const footerLoaderPath = path.join(__dirname, 'js/footer-loader.js');
  if (fs.existsSync(footerLoaderPath)) {
    let footerLoader = fs.readFileSync(footerLoaderPath, 'utf-8');
    footerLoader = footerLoader.replace(/const token = '[^']*';/, `const token = 'v=${buildVersion}';`);
    fs.writeFileSync(footerLoaderPath, footerLoader, 'utf-8');
    console.log("  - Updated js/footer-loader.js token");
  }
} catch (err) {
  console.error("ERROR updating loaders token:", err);
}

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
