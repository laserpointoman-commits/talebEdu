#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying TalebEdu Setup...\n');

let errors = [];
let warnings = [];
let success = [];

// Check critical files
const criticalFiles = [
  'capacitor.config.ts',
  'ios/App/Podfile',
  'ios/App/App/Info.plist',
  'ios/App/App/App.entitlements',
  'ios/App/App/NFCPlugin.swift',
  'ios/App/App/AppDelegate.swift',
  'android/app/src/main/AndroidManifest.xml',
  'src/services/nfcService.ts',
  'package.json'
];

console.log('📁 Checking critical files...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success.push(`✅ ${file}`);
  } else {
    errors.push(`❌ Missing: ${file}`);
  }
});

// Check iOS folder structure
console.log('\n📱 Checking iOS structure...');
if (fs.existsSync('ios/App')) {
  success.push('✅ iOS App folder exists');
  
  // Check if NFCPlugin is in the right place
  if (fs.existsSync('ios/App/App/NFCPlugin.swift')) {
    const nfcContent = fs.readFileSync('ios/App/App/NFCPlugin.swift', 'utf8');
    if (nfcContent.includes('NFCNDEFReaderSession') && nfcContent.includes('@objc(NFCPlugin)')) {
      success.push('✅ NFCPlugin.swift is properly configured');
    } else {
      warnings.push('⚠️  NFCPlugin.swift may be incomplete');
    }
  }
  
  // Check entitlements
  if (fs.existsSync('ios/App/App/App.entitlements')) {
    const entitlements = fs.readFileSync('ios/App/App/App.entitlements', 'utf8');
    if (entitlements.includes('com.apple.developer.nfc.readersession.formats')) {
      success.push('✅ NFC entitlements configured');
    } else {
      errors.push('❌ NFC entitlements missing in App.entitlements');
    }
  }
  
  // Check Info.plist
  if (fs.existsSync('ios/App/App/Info.plist')) {
    const infoPlist = fs.readFileSync('ios/App/App/Info.plist', 'utf8');
    if (infoPlist.includes('NFCReaderUsageDescription')) {
      success.push('✅ NFC usage description in Info.plist');
    } else {
      errors.push('❌ NFCReaderUsageDescription missing in Info.plist');
    }
  }
} else {
  errors.push('❌ iOS App folder does not exist - run: npx cap add ios');
}

// Check Android folder structure
console.log('\n🤖 Checking Android structure...');
if (fs.existsSync('android/app')) {
  success.push('✅ Android app folder exists');
  
  if (fs.existsSync('android/app/src/main/AndroidManifest.xml')) {
    const manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
    if (manifest.includes('android.permission.NFC')) {
      success.push('✅ NFC permission in AndroidManifest.xml');
    } else {
      warnings.push('⚠️  NFC permission missing in AndroidManifest.xml');
    }
  }
} else {
  errors.push('❌ Android app folder does not exist - run: npx cap add android');
}

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    '@capacitor/core',
    '@capacitor/ios',
    '@capacitor/android',
    '@capacitor/cli'
  ];
  
  requiredDeps.forEach(dep => {
    if (pkg.dependencies[dep] || pkg.devDependencies[dep]) {
      success.push(`✅ ${dep} installed`);
    } else {
      errors.push(`❌ Missing dependency: ${dep}`);
    }
  });
  
  // Check for old NFC plugins that should be removed
  const oldPlugins = [
    '@exxili/capacitor-nfc',
    '@capawesome-team/capacitor-nfc',
    'capacitor-nfc'
  ];
  
  oldPlugins.forEach(plugin => {
    if (pkg.dependencies[plugin]) {
      warnings.push(`⚠️  Old NFC plugin found: ${plugin} - should be removed`);
    }
  });
}

// Check Capacitor config
console.log('\n⚙️  Checking Capacitor config...');
if (fs.existsSync('capacitor.config.ts')) {
  const configContent = fs.readFileSync('capacitor.config.ts', 'utf8');
  if (configContent.includes("appId: 'com.talebedu.app'")) {
    success.push('✅ Capacitor config has correct appId');
  } else {
    warnings.push('⚠️  Check appId in capacitor.config.ts');
  }
  
  if (configContent.includes('NFCPlugin')) {
    success.push('✅ NFCPlugin configured in capacitor.config.ts');
  } else {
    warnings.push('⚠️  NFCPlugin not found in capacitor.config.ts');
  }
}

// Check if dist folder exists (web assets built)
console.log('\n🌐 Checking web build...');
if (fs.existsSync('dist')) {
  success.push('✅ dist folder exists (web assets built)');
} else {
  warnings.push('⚠️  dist folder missing - run: npm run build');
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION RESULTS');
console.log('='.repeat(60) + '\n');

if (success.length > 0) {
  console.log('✅ SUCCESS:\n');
  success.forEach(msg => console.log('  ' + msg));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach(msg => console.log('  ' + msg));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ ERRORS:\n');
  errors.forEach(msg => console.log('  ' + msg));
  console.log('');
}

console.log('='.repeat(60));

if (errors.length === 0) {
  console.log('\n✅ Setup verification PASSED!');
  console.log('\n📖 Next steps:');
  console.log('   • See BUILD_INSTRUCTIONS.md for platform-specific setup');
  console.log('   • iOS: cd ios/App && pod install --repo-update');
  console.log('   • iOS: Manually add NFCPlugin.swift to Xcode project');
  console.log('   • Android: npx cap open android');
  process.exit(0);
} else {
  console.log('\n❌ Setup verification FAILED');
  console.log('   Fix the errors above and run this script again.');
  process.exit(1);
}
