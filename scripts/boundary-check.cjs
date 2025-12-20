#!/usr/bin/env node
// scripts/boundary-check.cjs
// Pre-commit boundary enforcement check

const fs = require('fs');
const path = require('path');

// Domain definitions
const SANCTUARY_PATHS = [
  'porch/',
  '_sanctuary_extracted/',
];

const CLEARINGHOUSE_PATHS = [
  'index.html',
  'api/chat.js',
];

// Keywords that indicate boundary violations
const ELDON_KEYWORDS = ['Eldon', 'eldon', 'ELDON'];

// Extended mythic keywords for better detection
const MYTHIC_KEYWORDS = [
  'cosmic cowboy', 
  'gatekeeper', 
  'threshold between worlds', 
  'stars and dust',
  'sacred space',
  'mythic realm',
  'dreamweaver',
  'algo-rhythm',
  'the forge',
  'mirror of wisdom',
];

const PROFESSIONAL_KEYWORDS = ['professional', 'utilitarian', 'service', 'support'];


// Get staged files
function getStagedFiles() {
  const { execSync } = require('child_process');
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (err) {
    console.error('Error getting staged files:', err.message);
    return [];
  }
}

// Read file content
function readFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (err) {
    return null;
  }
}

// Check if file is in Sanctuary domain
function isSanctuaryFile(filePath) {
  return SANCTUARY_PATHS.some(sp => filePath.startsWith(sp));
}

// Check if file is in Clearinghouse domain
function isClearinghouseFile(filePath) {
  return CLEARINGHOUSE_PATHS.some(cp => filePath === cp || filePath.startsWith(cp));
}

// Check for Eldon in non-Sanctuary files
function checkEldonInClearinghouse(filePath, content) {
  if (!isClearinghouseFile(filePath)) {
    return null;
  }
  
  for (const keyword of ELDON_KEYWORDS) {
    if (content.includes(keyword)) {
      return {
        type: 'BOUNDARY_VIOLATION',
        severity: 'ERROR',
        file: filePath,
        message: `Eldon persona found in Clearinghouse context (${filePath}). Eldon MUST stay in Sanctuary only.`,
        suggestion: 'Use generic guide persona in Clearinghouse. Relocate Eldon references to /porch/ if needed.',
      };
    }
  }
  
  return null;
}

// Check for mythic language in Clearinghouse
function checkMythicInClearinghouse(filePath, content) {
  if (!isClearinghouseFile(filePath)) {
    return null;
  }
  
  const violations = [];
  for (const keyword of MYTHIC_KEYWORDS) {
    if (content.toLowerCase().includes(keyword.toLowerCase())) {
      violations.push(keyword);
    }
  }
  
  if (violations.length > 0) {
    return {
      type: 'BOUNDARY_VIOLATION',
      severity: 'WARNING',
      file: filePath,
      message: `Mythic language found in Clearinghouse context: ${violations.join(', ')}`,
      suggestion: 'Keep Clearinghouse language professional and neutral. Move mythic elements to Sanctuary.',
    };
  }
  
  return null;
}

// Check for professional language in Sanctuary
function checkProfessionalInSanctuary(filePath, content) {
  if (!isSanctuaryFile(filePath)) {
    return null;
  }
  
  // Extended list of professional/corporate language patterns
  const professionalPatterns = [
    /professional service/i,
    /customer support/i,
    /business hours/i,
    /corporate/i,
    /enterprise solution/i,
    /client portal/i,
    /service level/i,
    /kpi/i,
    /roi/i,
    /stakeholder/i,
    /deliverable/i,
    /value proposition/i,
  ];
  
  const violations = [];
  for (const pattern of professionalPatterns) {
    if (pattern.test(content)) {
      violations.push(pattern.source);
    }
  }
  
  if (violations.length > 0) {
    return {
      type: 'BOUNDARY_VIOLATION',
      severity: 'WARNING',
      file: filePath,
      message: `Professional language found in Sanctuary context: ${violations.join(', ')}`,
      suggestion: 'Keep Sanctuary language mythic and symbolic. Remove professional/corporate tone.',
    };
  }
  
  return null;
}

// Check for deletion of symbolic elements
function checkSymbolicDeletion(filePath) {
  // Check if Sanctuary file is being deleted
  if (isSanctuaryFile(filePath)) {
    try {
      const { execSync } = require('child_process');
      const status = execSync(`git diff --cached --diff-filter=D --name-only`, { encoding: 'utf-8' });
      if (status.includes(filePath)) {
        return {
          type: 'BOUNDARY_VIOLATION',
          severity: 'ERROR',
          file: filePath,
          message: `Sanctuary file deletion detected: ${filePath}`,
          suggestion: 'Symbolic elements must be relocated, not deleted. Seek explicit permission from Wolfman before deletion.',
        };
      }
    } catch (err) {
      // Log error if it's not just an empty result
      if (err.code !== 0 && err.message && !err.message.includes('no changes')) {
        console.warn(`Warning: Could not check for file deletions: ${err.message}`);
      }
    }
  }
  
  return null;
}

// Main check function
function performBoundaryCheck() {
  console.log('🛡️  Running boundary enforcement check...\n');
  
  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log('✅ No staged files to check.');
    return true;
  }
  
  const violations = [];
  
  for (const filePath of stagedFiles) {
    // Skip non-relevant files
    if (!filePath.endsWith('.html') && 
        !filePath.endsWith('.js') && 
        !filePath.endsWith('.md')) {
      continue;
    }
    
    const content = readFile(filePath);
    if (!content) {
      continue;
    }
    
    // Run all checks
    const checks = [
      checkEldonInClearinghouse(filePath, content),
      checkMythicInClearinghouse(filePath, content),
      checkProfessionalInSanctuary(filePath, content),
      checkSymbolicDeletion(filePath),
    ];
    
    // Collect violations
    for (const result of checks) {
      if (result) {
        violations.push(result);
      }
    }
  }
  
  // Report violations
  if (violations.length === 0) {
    console.log('✅ No boundary violations detected.\n');
    return true;
  }
  
  console.log('⚠️  BOUNDARY VIOLATIONS DETECTED:\n');
  
  const errors = violations.filter(v => v.severity === 'ERROR');
  const warnings = violations.filter(v => v.severity === 'WARNING');
  
  // Show errors
  if (errors.length > 0) {
    console.log('❌ ERRORS (must fix):');
    errors.forEach((v, i) => {
      console.log(`\n${i + 1}. [${v.type}] ${v.file}`);
      console.log(`   ${v.message}`);
      console.log(`   💡 ${v.suggestion}`);
    });
  }
  
  // Show warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (review recommended):');
    warnings.forEach((v, i) => {
      console.log(`\n${i + 1}. [${v.type}] ${v.file}`);
      console.log(`   ${v.message}`);
      console.log(`   💡 ${v.suggestion}`);
    });
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log('🛡️  Boundary Enforcement Rules:');
  console.log('   • Sanctuary is sacred (mythic, symbolic, cowboy voice)');
  console.log('   • Clearinghouse is neutral (professional, utilitarian)');
  console.log('   • Eldon stays in Sanctuary ONLY');
  console.log('   • Relocate symbolic elements, never delete');
  console.log('   • When in doubt, STOP and ASK');
  console.log('─'.repeat(60) + '\n');
  
  // Block commit if there are errors
  if (errors.length > 0) {
    console.log('❌ COMMIT BLOCKED due to boundary violations.');
    console.log('   Fix errors above, then try again.\n');
    return false;
  }
  
  // Allow commit with warnings
  if (warnings.length > 0) {
    console.log('⚠️  COMMIT ALLOWED with warnings.');
    console.log('   Please review warnings and consider fixes.\n');
  }
  
  return true;
}

// Run the check
const success = performBoundaryCheck();
process.exit(success ? 0 : 1);
