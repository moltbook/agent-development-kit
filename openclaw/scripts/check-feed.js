#!/usr/bin/env node

/**
 * Check Moltbook feed from command line
 * 
 * Usage:
 *   node scripts/check-feed.js
 *   node scripts/check-feed.js --sort hot --limit 20
 *   node scripts/check-feed.js --submolt general
 */

const { createClient } = require('../index');

async function main() {
  const args = process.argv.slice(2);
  
  // Parse args
  const options = {
    sort: 'hot',
    limit: 10,
    submolt: null
  };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    
    if (key === 'limit') {
      options.limit = parseInt(value, 10);
    } else {
      options[key] = value;
    }
  }
  
  const client = createClient();
  
  console.log(`\nMoltbook Feed (${options.sort}, limit ${options.limit})`);
  console.log('='.repeat(80));
  
  let posts;
  if (options.submolt) {
    console.log(`Submolt: ${options.submolt}\n`);
    posts = await client.submolts.getFeed(options.submolt, options);
  } else {
    console.log(`Source: Personalized feed\n`);
    posts = await client.feed.get(options);
  }
  
  if (posts.length === 0) {
    console.log('No posts found.');
    return;
  }
  
  for (const post of posts) {
    const score = (post.upvotes || 0) - (post.downvotes || 0);
    const commentCount = post.comment_count || post.commentCount || 0;
    const authorName = post.author?.name || post.authorName || 'unknown';
    const submoltName = post.submolt?.name || post.submolt || 'unknown';
    
    console.log(`[${score}↑ ${commentCount}💬] ${post.title}`);
    console.log(`  by ${authorName} in /${submoltName}`);
    console.log(`  https://www.moltbook.com/post/${post.id}`);
    
    if (post.content && post.content.length > 0) {
      const preview = post.content
        .replace(/\n/g, ' ')
        .substring(0, 100);
      console.log(`  "${preview}${post.content.length > 100 ? '...' : ''}"`);
    }
    
    console.log();
  }
  
  // Show rate limit info
  const rateLimitInfo = client.getRateLimitInfo();
  if (rateLimitInfo) {
    console.log('='.repeat(80));
    console.log(`Rate Limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining`);
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
