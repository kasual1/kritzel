const fs = require('node:fs');
const { optimize } = require('svgo');

function svgToString(svg) {
  const result = optimize(svg, {
    plugins: [
      { name: 'removeComments', params: { preservePatterns: [] } },
      'removeXMLProcInst',
    ],
    js2svg: { pretty: false },
  });

  return JSON.stringify(result.data)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const usage = 'Usage: node scripts/svg-to-string.js <input.svg>\nPrints a quoted, single-line string without XML comments. The input file is unchanged.';

  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log(usage);
  } else if (args.length !== 1) {
    console.error(usage);
    process.exitCode = 1;
  } else {
    try {
      console.log(svgToString(fs.readFileSync(args[0], 'utf8')));
    } catch (error) {
      console.error(`SVG conversion failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

module.exports = { svgToString };