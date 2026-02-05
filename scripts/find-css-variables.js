/**
 * Script to find all CSS variables (--kritzel-*) in the kritzel-stencil component CSS files
 * and generate a complete list of theme properties for the KritzelTheme interface.
 *
 * Usage: node scripts/find-css-variables.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = path.join(__dirname, '../libs/kritzel-stencil/src');
const CSS_FILE_PATTERN = /\.css$/;
const CSS_VARIABLE_PATTERN = /--kritzel-([a-zA-Z0-9-]+)/g;

/**
 * Recursively find all CSS files in a directory
 */
function findCssFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      findCssFiles(fullPath, files);
    } else if (entry.isFile() && CSS_FILE_PATTERN.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract all CSS variable names from a file
 */
function extractVariablesFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const variables = new Set();
  let match;

  while ((match = CSS_VARIABLE_PATTERN.exec(content)) !== null) {
    variables.add(`--kritzel-${match[1]}`);
  }

  return {
    file: path.relative(SOURCE_DIR, filePath),
    variables: Array.from(variables),
  };
}

/**
 * Group variables by component/category
 */
function groupVariablesByCategory(variablesMap) {
  const groups = {};

  for (const [variable] of variablesMap.entries()) {
    // Parse the variable name to extract the category
    // e.g., --kritzel-controls-gap -> controls
    // e.g., --kritzel-menu-item-padding -> menu
    const parts = variable.replace('--kritzel-', '').split('-');

    // Try to identify the category
    let category = 'global';

    // Known categories based on existing theme structure
    const knownCategories = [
      'engine',
      'controls',
      'tooltip',
      'context-menu',
      'menu',
      'slide-toggle',
      'split-button',
      'dropdown',
      'opacity-slider',
      'stroke-size',
      'line-endings',
      'utility-panel',
      'color-palette',
      'submenu',
      'portal',
      'more-menu',
      'back-to-content',
      'numeric-input',
      'shape-fill',
      'settings',
      'dialog',
      'export',
    ];

    for (const knownCategory of knownCategories) {
      const categoryParts = knownCategory.split('-');
      const prefix = categoryParts.join('-');

      if (variable.startsWith(`--kritzel-${prefix}-`)) {
        category = knownCategory;
        break;
      }
    }

    // Handle menu-item specially - should be under menu
    if (variable.startsWith('--kritzel-menu-item-')) {
      category = 'menu';
    }

    // Handle context-menu-item specially
    if (variable.startsWith('--kritzel-context-menu-item-')) {
      category = 'context-menu';
    }

    if (!groups[category]) {
      groups[category] = new Set();
    }
    groups[category].add(variable);
  }

  return groups;
}

/**
 * Convert CSS variable name to camelCase property name
 */
function toCamelCase(cssVariable, category) {
  // Remove the --kritzel- prefix and the category prefix
  let name = cssVariable.replace('--kritzel-', '');

  // Remove category prefix if present
  const categoryPrefix = category.replace(/-/g, '-');
  if (name.startsWith(`${categoryPrefix}-`)) {
    name = name.substring(categoryPrefix.length + 1);
  }

  // Handle special cases
  if (name.startsWith('item-') && (category === 'menu' || category === 'context-menu')) {
    // Keep the item prefix for menu items
    name = name;
  }

  // Convert kebab-case to camelCase
  return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Generate TypeScript interface from grouped variables
 */
function generateInterface(groups) {
  const lines = ['/**', ' * Auto-generated CSS variable mapping', ' * Run `node scripts/find-css-variables.js` to update', ' */\n'];

  lines.push('export interface CssVariableMapping {');

  // Sort categories
  const sortedCategories = Object.keys(groups).sort((a, b) => {
    if (a === 'global') return -1;
    if (b === 'global') return 1;
    return a.localeCompare(b);
  });

  for (const category of sortedCategories) {
    const variables = Array.from(groups[category]).sort();
    const categoryName = category.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

    lines.push(`\n  /** ${category} variables */`);
    lines.push(`  ${categoryName}: {`);

    for (const variable of variables) {
      const propName = toCamelCase(variable, category);
      lines.push(`    /** CSS: ${variable} */`);
      lines.push(`    ${propName}: string;`);
    }

    lines.push('  };');
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning CSS files for CSS variables...\n');

  const cssFiles = findCssFiles(SOURCE_DIR);
  console.log(`Found ${cssFiles.length} CSS files\n`);

  // Collect all unique variables
  const allVariables = new Map();
  const fileResults = [];

  for (const file of cssFiles) {
    const result = extractVariablesFromFile(file);
    fileResults.push(result);

    for (const variable of result.variables) {
      if (!allVariables.has(variable)) {
        allVariables.set(variable, []);
      }
      allVariables.get(variable).push(result.file);
    }
  }

  console.log(`Found ${allVariables.size} unique CSS variables\n`);

  // Print variables by file
  console.log('📁 Variables by file:');
  console.log('='.repeat(80));

  for (const result of fileResults) {
    if (result.variables.length > 0) {
      console.log(`\n${result.file}:`);
      for (const variable of result.variables.sort()) {
        console.log(`  ${variable}`);
      }
    }
  }

  // Print all unique variables
  console.log('\n\n📋 All unique CSS variables (sorted):');
  console.log('='.repeat(80));

  const sortedVariables = Array.from(allVariables.keys()).sort();
  for (const variable of sortedVariables) {
    console.log(variable);
  }

  // Group by category
  const groups = groupVariablesByCategory(allVariables);

  console.log('\n\n📊 Variables grouped by category:');
  console.log('='.repeat(80));

  const sortedCategories = Object.keys(groups).sort((a, b) => {
    if (a === 'global') return -1;
    if (b === 'global') return 1;
    return a.localeCompare(b);
  });

  for (const category of sortedCategories) {
    console.log(`\n[${category}]`);
    const variables = Array.from(groups[category]).sort();
    for (const variable of variables) {
      const propName = toCamelCase(variable, category);
      console.log(`  ${propName}: '${variable}'`);
    }
  }

  // Compare with existing theme interface
  console.log('\n\n🔄 Comparing with existing KritzelTheme interface...');
  console.log('='.repeat(80));

  // Read existing interface
  const themeInterfacePath = path.join(SOURCE_DIR, 'interfaces', 'theme.interface.ts');
  const existingInterface = fs.readFileSync(themeInterfacePath, 'utf-8');

  // Extract existing properties from the interface
  const existingVariables = new Set();
  const existingPropsMatch = existingInterface.match(/(\w+):\s*string;/g);
  if (existingPropsMatch) {
    for (const match of existingPropsMatch) {
      const propName = match.match(/(\w+):/)[1];
      existingVariables.add(propName);
    }
  }

  // Find variables in CSS that might be missing from the theme
  const missingFromTheme = [];
  const foundInTheme = [];

  for (const variable of sortedVariables) {
    const parts = variable.replace('--kritzel-', '').split('-');
    const camelCase = parts.map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))).join('');

    // Check if this variable name (in some form) exists in the interface
    if (existingInterface.includes(camelCase) || existingInterface.includes(variable)) {
      foundInTheme.push(variable);
    } else {
      missingFromTheme.push(variable);
    }
  }

  if (missingFromTheme.length > 0) {
    console.log('\n⚠️  CSS variables NOT found in KritzelTheme interface:');
    for (const variable of missingFromTheme) {
      console.log(`  ${variable}`);
    }
  } else {
    console.log('\n✅ All CSS variables appear to be covered in the theme interface.');
  }

  // Generate suggested additions
  console.log('\n\n📝 Suggested additions to KritzelTheme:');
  console.log('='.repeat(80));

  if (missingFromTheme.length > 0) {
    const missingGroups = groupVariablesByCategory(new Map(missingFromTheme.map((v) => [v, []])));

    for (const category of Object.keys(missingGroups).sort()) {
      console.log(`\n// ${category}`);
      const variables = Array.from(missingGroups[category]).sort();
      for (const variable of variables) {
        const propName = toCamelCase(variable, category);
        console.log(`${propName}: string;  // ${variable}`);
      }
    }
  }

  // Summary statistics
  console.log('\n\n📈 Summary:');
  console.log('='.repeat(80));
  console.log(`Total CSS files scanned: ${cssFiles.length}`);
  console.log(`Total unique CSS variables: ${allVariables.size}`);
  console.log(`Categories found: ${Object.keys(groups).length}`);
  console.log(`Variables potentially missing from theme: ${missingFromTheme.length}`);
}

main();
