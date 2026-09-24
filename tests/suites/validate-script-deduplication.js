#!/usr/bin/env node

/**
 * Validate Firebase Script Deduplication
 * Checks all HTML files for duplicate Firebase script inclusions
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Validating Firebase Script Deduplication Across All Pages');
console.log('============================================================');

// Function to check for Firebase script duplicates in a file
function checkFirebaseScripts(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Count Firebase script tags
    const firebaseScriptMatches = content.match(/https:\/\/www\.gstatic\.com\/firebasejs\/[^"]+/g) || [];
    const uniqueFirebaseUrls = new Set(firebaseScriptMatches);
    
    // Check for different versions of the same service
    const versions = {};
    const services = {};
    
    firebaseScriptMatches.forEach(url => {
      const versionMatch = url.match(/firebasejs\/([^\/]+)\//);
      const serviceMatch = url.match(/firebase-([^-\.]+)/);
      
      if (versionMatch && serviceMatch) {
        const version = versionMatch[1];
        const service = serviceMatch[1];
        
        if (!versions[version]) versions[version] = new Set();
        if (!services[service]) services[service] = new Set();
        
        versions[version].add(service);
        services[service].add(version);
      }
    });
    
    // Check firebase-script-loader usage
    const hasScriptLoader = content.includes('firebase-script-loader.js');
    const hasLoaderCall = content.includes('firebaseScriptLoader.loadFirebaseScripts');
    
    const results = {
      filePath: filePath.replace(__dirname + '/', ''),
      totalScripts: firebaseScriptMatches.length,
      uniqueUrls: uniqueFirebaseUrls.size,
      duplicateUrls: firebaseScriptMatches.length - uniqueFirebaseUrls.size,
      versions: Object.keys(versions),
      services: Object.keys(services),
      hasScriptLoader,
      hasLoaderCall,
      issues: []
    };
    
    // Detect issues
    if (results.duplicateUrls > 0) {
      results.issues.push(`${results.duplicateUrls} duplicate script URLs`);
    }
    
    if (results.versions.length > 1) {
      results.issues.push(`Multiple Firebase versions: ${results.versions.join(', ')}`);
    }
    
    // Check for services loaded multiple times
    Object.entries(services).forEach(([service, versionSet]) => {
      if (versionSet.size > 1) {
        results.issues.push(`${service} loaded with multiple versions: ${Array.from(versionSet).join(', ')}`);
      }
    });
    
    // Check each service for duplicates within same version
    Object.entries(versions).forEach(([version, serviceSet]) => {
      Array.from(serviceSet).forEach(service => {
        const servicePattern = new RegExp(`firebasejs\\/${version}\\/firebase-${service}[^"]*`, 'g');
        const serviceMatches = content.match(servicePattern) || [];
        if (serviceMatches.length > 1) {
          results.issues.push(`${service} v${version} loaded ${serviceMatches.length} times`);
        }
      });
    });
    
    return results;
    
  } catch (error) {
    return {
      filePath: filePath.replace(__dirname + '/', ''),
      error: error.message
    };
  }
}

// Find all HTML files
const htmlFiles = [
  'public/index.html',
  'public/pages/auth.html',
  'public/pages/student-dashboard.html',
  'public/pages/settings.html',
  'public/pages/sessions.html',
  'public/pages/messages.html',
  'public/pages/notifications.html',
  'public/pages/admin-dashboard.html'
];

console.log(`📋 Checking ${htmlFiles.length} HTML files for Firebase script issues...\n`);

let totalIssues = 0;
const results = [];

htmlFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const result = checkFirebaseScripts(fullPath);
    results.push(result);
    
    const status = result.issues?.length > 0 ? '❌' : '✅';
    console.log(`${status} ${result.filePath}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else {
      console.log(`   Scripts: ${result.totalScripts} total, ${result.uniqueUrls} unique`);
      if (result.versions.length > 0) {
        console.log(`   Versions: ${result.versions.join(', ')}`);
      }
      if (result.hasScriptLoader || result.hasLoaderCall) {
        console.log(`   Script Loader: ${result.hasScriptLoader ? 'included' : 'missing'}, ${result.hasLoaderCall ? 'used' : 'not used'}`);
      }
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`   🚨 ${issue}`));
        totalIssues += result.issues.length;
      }
    }
    console.log('');
  } else {
    console.log(`⚠️ ${filePath} - File not found\n`);
  }
});

console.log('📊 SUMMARY');
console.log('==========');
console.log(`Total files checked: ${results.length}`);
console.log(`Total issues found: ${totalIssues}`);

const filesWithIssues = results.filter(r => r.issues && r.issues.length > 0);
if (filesWithIssues.length > 0) {
  console.log(`Files with issues: ${filesWithIssues.length}`);
  console.log('\n🔧 RECOMMENDED ACTIONS:');
  filesWithIssues.forEach(result => {
    console.log(`\n${result.filePath}:`);
    result.issues.forEach(issue => console.log(`  • Fix: ${issue}`));
  });
} else {
  console.log('🎉 No duplicate Firebase script issues found!');
}

console.log(`\n✅ Firebase script deduplication validation completed`);