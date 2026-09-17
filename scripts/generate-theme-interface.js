/**
 * Script to find all CSS variables (--kritzel-*) in the engine/editor component CSS files
 * and generate/update the theme.interface.ts file.
 *
 * Usage: node scripts/generate-theme-interface.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ENGINE_SOURCE_DIR = path.join(__dirname, '../libs/engine/core/src');
const EDITOR_SOURCE_DIR = path.join(__dirname, '../libs/editor/core/src');
const THEME_INTERFACE_PATH = path.join(ENGINE_SOURCE_DIR, 'interfaces', 'theme.interface.ts');
const CSS_FILE_PATTERN = /\.(css|tsx|ts)$/;
const CSS_VARIABLE_PATTERN = /--kritzel-([a-zA-Z0-9-]+)/g;

// Known categories based on component structure
const KNOWN_CATEGORIES = [
  'engine',
  'snap',
  'toolbar',
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
  'text-input',
  'pill-tabs',
  'shape-fill',
  'settings',
  'notification-card',
  'dialog',
  'export',
  'master-detail',
  'editor',
  'font-size',
  'selection',
  'checkerboard',
  'button',
  'avatar',
  'active-users',
  'share-dialog',
  'login-dialog',
  'current-user-dialog',
  'awareness',
  'watermark',
  'zoom-panel',
  'sync-indicator'
];

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

  // Reset regex state
  CSS_VARIABLE_PATTERN.lastIndex = 0;

  while ((match = CSS_VARIABLE_PATTERN.exec(content)) !== null) {
    variables.add(`--kritzel-${match[1]}`);
  }

  return Array.from(variables);
}

/**
 * Determine the category for a CSS variable
 */
function getCategoryForVariable(variable) {
  const name = variable.replace('--kritzel-', '');

  // Sort categories by length (longest first) to match most specific first
  const sortedCategories = [...KNOWN_CATEGORIES].sort((a, b) => b.length - a.length);

  for (const category of sortedCategories) {
    if (name.startsWith(`${category}-`)) {
      return category;
    }
  }

  // Special handling for sub-categories
  if (name.startsWith('menu-item-')) {
    return 'menu';
  }
  if (name.startsWith('context-menu-item-')) {
    return 'context-menu';
  }
  if (name.startsWith('control-')) {
    return 'controls';
  }

  return 'global';
}

/**
 * Group variables by category
 */
function groupVariablesByCategory(variables) {
  const groups = {};

  for (const variable of variables) {
    const category = getCategoryForVariable(variable);

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
  let name = cssVariable.replace('--kritzel-', '');

  // Remove category prefix if present
  const categoryPrefix = category;
  if (name.startsWith(`${categoryPrefix}-`)) {
    name = name.substring(categoryPrefix.length + 1);
  }

  // Convert kebab-case to camelCase
  return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert category name to PascalCase for interface grouping
 */
function categoryToCamelCase(category) {
  return category.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Generate the TypeScript theme interface content
 */
function generateThemeInterface(groups) {
  const lines = [];

  // Type definition for theme name
  lines.push("/**");
  lines.push(" * Theme name type for available themes");
  lines.push(" */");
  lines.push("export type ThemeName = 'light' | 'dark' | (string & NonNullable<unknown>);");
  lines.push("");

  // Main interface
  lines.push("/**");
  lines.push(" * Complete theme definition with all CSS variable values grouped by category");
  lines.push(" */");
  lines.push("export interface KritzelTheme {");
  lines.push("  /** Theme identifier */");
  lines.push("  name: ThemeName;");

  // Sort categories: global first, then alphabetically
  const sortedCategories = Object.keys(groups).sort((a, b) => {
    if (a === 'global') return -1;
    if (b === 'global') return 1;
    return a.localeCompare(b);
  });

  for (const category of sortedCategories) {
    const variables = Array.from(groups[category]).sort();
    const categoryName = categoryToCamelCase(category);
    const categoryLabel = category.replace(/-/g, ' ');

    lines.push("");
    lines.push(`  /** ${categoryLabel.charAt(0).toUpperCase() + categoryLabel.slice(1)} variables */`);
    lines.push(`  ${categoryName}?: {`);

    const seenProps = new Set();
    for (const variable of variables) {
      const propName = toCamelCase(variable, category);
      if (seenProps.has(propName)) {
        continue;
      }
      seenProps.add(propName);
      lines.push(`    ${propName}?: string;`);
    }

    lines.push("  };");
  }

  lines.push("}");

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning CSS files for CSS variables...\n');

  const cssFiles = [
    ...findCssFiles(ENGINE_SOURCE_DIR),
    ...findCssFiles(EDITOR_SOURCE_DIR),
  ];
  console.log(`Found ${cssFiles.length} CSS files\n`);

  // Collect all unique variables
  const allVariables = new Set();

  for (const file of cssFiles) {
    const variables = extractVariablesFromFile(file);
    for (const variable of variables) {
      allVariables.add(variable);
    }
  }

  console.log(`Found ${allVariables.size} unique CSS variables\n`);

  // Group by category
  const groups = groupVariablesByCategory(allVariables);

  // Print summary
  console.log('📊 Variables grouped by category:');
  console.log('='.repeat(60));

  const sortedCategories = Object.keys(groups).sort((a, b) => {
    if (a === 'global') return -1;
    if (b === 'global') return 1;
    return a.localeCompare(b);
  });

  for (const category of sortedCategories) {
    const variables = Array.from(groups[category]).sort();
    console.log(`\n[${category}] (${variables.length} variables)`);
    const seenSummaryProps = new Set();
    for (const variable of variables) {
      const propName = toCamelCase(variable, category);
      if (seenSummaryProps.has(propName)) {
        continue;
      }
      seenSummaryProps.add(propName);
      console.log(`  ${propName}`);
    }
  }

  // Generate the interface content
  const interfaceContent = generateThemeInterface(groups);

  // Write to file
  fs.writeFileSync(THEME_INTERFACE_PATH, interfaceContent, 'utf-8');

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Updated ${path.relative(process.cwd(), THEME_INTERFACE_PATH)}`);
  console.log(`   Total categories: ${sortedCategories.length}`);
  console.log(`   Total variables: ${allVariables.size}`);
}

main();
