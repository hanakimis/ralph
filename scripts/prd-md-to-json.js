#!/usr/bin/env node

/**
 * Converts a PRD Markdown file to JSON format
 * Usage: node prd-md-to-json.js <input.md> [output.json]
 */

const fs = require('fs');

function convertMarkdownToPrd(markdown) {
  const lines = markdown.split('\n');
  const prd = {
    project: '',
    branchName: '',
    description: '',
    userStories: []
  };

  let currentStory = null;

  for (const line of lines) {
    // Project name: # ProjectName
    if (line.startsWith('# ')) {
      prd.project = line.slice(2).trim();
      continue;
    }

    // Branch: **Branch:** `branch-name`
    const branchMatch = line.match(/\*\*Branch:\*\*\s*`([^`]+)`/);
    if (branchMatch) {
      prd.branchName = branchMatch[1];
      continue;
    }

    // Description: plain text line after branch, before ## Tasks
    if (prd.project && prd.branchName && !line.startsWith('#') && !line.startsWith('-') && line.trim() && !prd.description) {
      prd.description = line.trim();
      continue;
    }

    // Task header: ### US-001: Title
    const storyMatch = line.match(/^###\s+(US-\d+):\s+(.+)$/);
    if (storyMatch) {
      if (currentStory) {
        prd.userStories.push(currentStory);
      }
      currentStory = {
        id: storyMatch[1],
        title: storyMatch[2].trim(),
        acceptanceCriteria: [],
        passes: true // assume passes until we find unchecked item
      };
      continue;
    }

    // Acceptance criteria: - [ ] or - [x]
    const criteriaMatch = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
    if (criteriaMatch && currentStory) {
      currentStory.acceptanceCriteria.push(criteriaMatch[2].trim());
      if (criteriaMatch[1] === ' ') {
        currentStory.passes = false;
      }
      continue;
    }
  }

  // Push last story
  if (currentStory) {
    prd.userStories.push(currentStory);
  }

  return prd;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node prd-md-to-json.js <input.md> [output.json]');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace(/\.md$/, '.json');

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    const mdContent = fs.readFileSync(inputFile, 'utf8');
    const prd = convertMarkdownToPrd(mdContent);
    const json = JSON.stringify(prd, null, 2);

    fs.writeFileSync(outputFile, json + '\n');
    console.log(`✓ Converted ${inputFile} → ${outputFile}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
