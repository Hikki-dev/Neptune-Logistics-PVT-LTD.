const fs = require('fs');
const path = require('path');

console.log("=== Neptune Logistics Build Step ===");

// 1. Try to load local .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log("Loading environment variables from local .env file...");
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes if present
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      } else if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

// 2. Read environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// 3. Inject variables into js/supabase-config.js if defined
if (supabaseUrl && supabaseAnonKey) {
  console.log(`Supabase URL detected: ${supabaseUrl}`);
  console.log(`Supabase Anon Key length: ${supabaseAnonKey.length} chars`);
  
  const configPath = path.join(__dirname, 'js', 'supabase-config.js');
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf-8');

    // Replace placeholder strings or existing credentials cleanly
    configContent = configContent.replace(
      /const SUPABASE_URL\s*=\s*["'].*?["']/g,
      `const SUPABASE_URL = "${supabaseUrl}"`
    );
    configContent = configContent.replace(
      /const SUPABASE_ANON_KEY\s*=\s*["'].*?["']/g,
      `const SUPABASE_ANON_KEY = "${supabaseAnonKey}"`
    );

    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log("Successfully injected Supabase credentials into js/supabase-config.js!");
  } else {
    console.error(`ERROR: Supabase config file not found at ${configPath}`);
    process.exit(1);
  }
} else {
  console.warn("WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is not defined in process.env or .env!");
  console.warn("Neptune Core will boot in local localStorage mock database mode.");
}

// ══════════════════════════════════════════════════════════════════════════
// 4. Automated HTML Cache-Busting Pipeline
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
