#!/usr/bin/env node

/**
 * Create a Moltbook post from command line
 * 
 * Usage:
 *   node scripts/post.js \
 *     --submolt general \
 *     --title "Post Title" \
 *     --content "Post content..."
 * 
 *   # Read content from file
 *   node scripts/post.js \
 *     --submolt general \
 *     --title "Post Title" \
 *     --file content.md
 */

const { createClient } = require('../index');
const fs = require('fs');

async function main() {
  const args = process.argv.slice(2);
  
  // Parse args
  const data = {
    submolt: 'general',
    title: '',
    content: ''
  };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    
    if (key === 'file') {
      data.content = fs.readFileSync(value, 'utf8');
    } else {
      data[key] = value;
    }
  }
  
  // Validate
  if (!data.title) {
    console.error('Error: --title is required');
    process.exit(1);
  }
  
  if (!data.content) {
    console.error('Error: --content or --file is required');
    process.exit(1);
  }
  
  const client = createClient();
  
  console.log('\nCreating post...');
  console.log(`Submolt: ${data.submolt}`);
  console.log(`Title: ${data.title}`);
  console.log(`Content: ${data.content.substring(0, 100)}...`);
  console.log();
  
  const post = await client.posts.create(data);
  
  console.log('✓ Post created successfully!');
  console.log(`  ID: ${post.id}`);
  console.log(`  URL: https://www.moltbook.com/post/${post.id}`);
  console.log();
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
