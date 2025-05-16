/**
 * Setup script for Frappe Learning Android app
 * This script helps with the initial setup of the Android app
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  appName: 'Frappe Learning',
  appId: 'com.frappe.lms',
  frontendDir: '../../frontend',
  androidDir: './android',
  iconsDir: '../../frontend/public/mobile-assets'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

/**
 * Run a command and log the output
 * @param {string} command Command to run
 * @param {string} cwd Working directory
 */
function runCommand(command, cwd = process.cwd()) {
  console.log(`${colors.blue}Running:${colors.reset} ${command}`);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    console.log(`${colors.green}Command completed successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Command failed:${colors.reset} ${error.message}`);
    process.exit(1);
  }
}

/**
 * Check if a directory exists
 * @param {string} dir Directory path
 * @returns {boolean} Whether directory exists
 */
function directoryExists(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Main setup function
 */
async function setup() {
  console.log(`\n${colors.green}=== Frappe Learning Android App Setup ===${colors.reset}\n`);

  // Check if frontend directory exists
  if (!directoryExists(config.frontendDir)) {
    console.error(`${colors.red}Error:${colors.reset} Frontend directory not found at ${config.frontendDir}`);
    process.exit(1);
  }

  // Step 1: Install dependencies
  console.log(`\n${colors.yellow}Step 1: Installing dependencies${colors.reset}`);
  runCommand('yarn install', config.frontendDir);

  // Step 2: Initialize Capacitor if not already done
  console.log(`\n${colors.yellow}Step 2: Initializing Capacitor${colors.reset}`);
  if (!fs.existsSync(path.join(config.frontendDir, 'capacitor.config.json'))) {
    runCommand(`npx cap init ${config.appName} ${config.appId} --web-dir=dist`, config.frontendDir);
  } else {
    console.log(`${colors.green}Capacitor already initialized${colors.reset}`);
  }

  // Step 3: Build the app for mobile
  console.log(`\n${colors.yellow}Step 3: Building app for mobile${colors.reset}`);
  runCommand('yarn build:mobile', config.frontendDir);

  // Step 4: Add Android platform if not already added
  console.log(`\n${colors.yellow}Step 4: Adding Android platform${colors.reset}`);
  if (!directoryExists(path.join(config.frontendDir, 'android'))) {
    runCommand('npx cap add android', config.frontendDir);
  } else {
    console.log(`${colors.green}Android platform already added${colors.reset}`);
  }

  // Step 5: Sync changes to Android
  console.log(`\n${colors.yellow}Step 5: Syncing changes to Android${colors.reset}`);
  runCommand('npx cap sync android', config.frontendDir);

  // Step 6: Create placeholder icons if they don't exist
  console.log(`\n${colors.yellow}Step 6: Checking app icons${colors.reset}`);
  const iconSizes = [192, 512];
  
  for (const size of iconSizes) {
    const iconPath = path.join(config.iconsDir, `icon-${size}x${size}.png`);
    if (!fs.existsSync(iconPath)) {
      console.log(`${colors.yellow}Warning:${colors.reset} Icon ${iconPath} not found. Please create it manually.`);
    }
  }

  // Step 7: Open in Android Studio
  console.log(`\n${colors.yellow}Step 7: Opening in Android Studio${colors.reset}`);
  console.log(`${colors.green}Setup complete!${colors.reset}`);
  console.log(`\nTo open the project in Android Studio, run:`);
  console.log(`${colors.blue}cd ${config.frontendDir} && npx cap open android${colors.reset}`);
}

// Run the setup
setup().catch(error => {
  console.error(`${colors.red}Setup failed:${colors.reset} ${error.message}`);
  process.exit(1);
});
