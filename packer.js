#!/usr/bin/env node

/**
 * Universal Packer Script
 * Packages the distribution folder into a zip file for deployment.
 */

import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Polyfill __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  distDir: 'dist',
  manifestPath: 'manifest.json', // or inside dist
  packageJsonPath: 'package.json'
};

// Load package info
let packageInfo = {};
try {
  packageInfo = JSON.parse(fs.readFileSync(path.resolve(__dirname, CONFIG.packageJsonPath), 'utf8'));
} catch (e) {
  console.warn('⚠️  Could not read package.json, using defaults.');
  packageInfo = { name: 'extension', version: '0.0.0' };
}

async function createPackage() {
  const distPath = path.resolve(__dirname, CONFIG.distDir);
  
  if (!fs.existsSync(distPath)) {
    console.error(`❌ Distribution directory '${CONFIG.distDir}' not found.`);
    console.log(`   Run your build script first (e.g., 'npm run build').`);
    process.exit(1);
  }

  // Create output filename based on package name and version
  const zipName = `${packageInfo.name}-v${packageInfo.version}.zip`;
  
  const outputPath = path.resolve(__dirname, zipName);

  console.log(`📦 Packaging '${packageInfo.name}' v${packageInfo.version}...`);
  console.log(`   Source: ${distPath}`);
  console.log(`   Target: ${zipName}`);

  // Create zip
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  return new Promise((resolve, reject) => {
    output.on('close', function() {
      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`\n✅ Package created successfully!`);
      console.log(`   File: ${zipName}`);
      console.log(`   Size: ${sizeMB} MB`);
      resolve();
    });

    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        console.warn('⚠️  Warning:', err);
      } else {
        reject(err);
      }
    });

    archive.on('error', function(err) {
      reject(err);
    });

    archive.pipe(output);

    // Append files from dist directory, putting its contents at the root of archive
    archive.directory(distPath, false);

    archive.finalize();
  });
}

createPackage().catch(err => {
  console.error('\n❌ Packaging failed:', err);
  process.exit(1);
});