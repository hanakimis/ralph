#!/usr/bin/env node

/**
 * Converts a PRD JSON file to Markdown format
 * Usage: node prd-json-to-md.js <input.json> [output.md]
 */

const fs = require('fs');

function convertPrdToMarkdown(prd) {
  const lines = [];

  // Header
  lines.push(`# ${prd.project}`);
  lines.push('');
  lines.push(`**Branch:** \`${prd.branchName}\``);
  lines.push('');
  lines.push(prd.description);
  lines.push('');
  lines.push('## Tasks');

  // User Stories
  for (const story of prd.userStories) {
    lines.push('');
    lines.push(`### ${story.id}: ${story.title}`);

    for (const criteria of story.acceptanceCriteria) {
      const checkbox = story.passes ? '[x]' : '[ ]';
      lines.push(`- ${checkbox} ${criteria}`);
    }
  }

  return lines.join('\n') + '\n';
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node prd-json-to-md.js <input.json> [output.md]');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace(/\.json$/, '.md');

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    const jsonContent = fs.readFileSync(inputFile, 'utf8');
    const prd = JSON.parse(jsonContent);
    const markdown = convertPrdToMarkdown(prd);

    fs.writeFileSync(outputFile, markdown);
    console.log(`✓ Converted ${inputFile} → ${outputFile}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
