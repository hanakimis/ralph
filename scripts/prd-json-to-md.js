#!/usr/bin/env node

/**
 * Converts a PRD JSON file to Markdown format
 * Usage: node prd-json-to-md.js <input.json> [output.md]
 */

const fs = require('fs');
const path = require('path');

function convertPrdToMarkdown(prd) {
  const lines = [];

  // Header
  lines.push(`# PRD: ${prd.description}`);
  lines.push('');
  lines.push(`**Project:** ${prd.project}`);
  lines.push(`**Branch:** \`${prd.branchName}\``);
  lines.push('');
  lines.push('## Description');
  lines.push('');
  lines.push(prd.description);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## User Stories');

  // User Stories
  for (const story of prd.userStories) {
    lines.push('');
    lines.push(`### ${story.id}: ${story.title}`);
    lines.push('');
    lines.push(`**Priority:** ${story.priority}`);
    lines.push(`**Status:** ${story.passes ? '✅ Complete' : '⬜ Pending'}`);
    lines.push('');
    lines.push(`> ${story.description}`);
    lines.push('');
    lines.push('#### Acceptance Criteria');
    lines.push('');

    for (const criteria of story.acceptanceCriteria) {
      const checkbox = story.passes ? '[x]' : '[ ]';
      lines.push(`- ${checkbox} ${criteria}`);
    }

    lines.push('');
    lines.push('#### Notes');
    lines.push('');
    lines.push(story.notes?.trim() || '_No notes_');
    lines.push('');
    lines.push('---');
  }

  // Remove trailing separator
  lines.pop();

  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node prd-json-to-md.js <input.json> [output.md]');
    console.error('');
    console.error('Examples:');
    console.error('  node prd-json-to-md.js prd.json');
    console.error('  node prd-json-to-md.js prd.json prd.md');
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
