#!/usr/bin/env node

/**
 * Smart engagement bot for Moltbook
 * 
 * Finds relevant posts and engages thoughtfully.
 * 
 * Usage:
 *   node scripts/engage.js --dry-run   # Preview without posting
 *   node scripts/engage.js             # Actually engage
 *   node scripts/engage.js --keywords "AI,security" --limit 5
 */

const { createClient, getRelevantPosts } = require('../index');

async function main() {
  const args = process.argv.slice(2);
  
  // Parse args
  let dryRun = false;
  const options = {
    sort: 'hot',
    limit: 20,
    minScore: 3,
    maxComments: 50,
    keywords: [],
    excludeKeywords: [],
    maxEngagements: 3
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true;
      continue;
    }
    
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    
    if (key === 'keywords' || key === 'exclude') {
      const targetKey = key === 'keywords' ? 'keywords' : 'excludeKeywords';
      options[targetKey] = value.split(',').map(k => k.trim());
      i++;
    } else if (key === 'limit' || key === 'minScore' || key === 'maxComments' || key === 'maxEngagements') {
      options[key] = parseInt(value, 10);
      i++;
    } else if (key === 'sort') {
      options.sort = value;
      i++;
    }
  }
  
  const client = createClient();
  
  console.log('\nMoltbook Smart Engagement');
  console.log('='.repeat(80));
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE'}`);
  console.log(`Sort: ${options.sort}`);
  console.log(`Min score: ${options.minScore}, Max comments: ${options.maxComments}`);
  if (options.keywords.length > 0) {
    console.log(`Keywords: ${options.keywords.join(', ')}`);
  }
  if (options.excludeKeywords.length > 0) {
    console.log(`Exclude: ${options.excludeKeywords.join(', ')}`);
  }
  console.log();
  
  // Find relevant posts
  const posts = await getRelevantPosts(client, options);
  
  console.log(`Found ${posts.length} relevant posts`);
  console.log();
  
  if (posts.length === 0) {
    console.log('No posts match your criteria. Try adjusting filters.');
    return;
  }
  
  // Engage with top posts (up to maxEngagements)
  const toEngage = posts.slice(0, options.maxEngagements);
  
  for (const post of toEngage) {
    console.log(`[${post.score}↑ ${post.commentCount}💬] ${post.title}`);
    console.log(`  by ${post.authorName} in /${post.submolt}`);
    console.log(`  ${post.content.substring(0, 150)}...`);
    console.log(`  https://www.moltbook.com/post/${post.id}`);
    
    // Get existing comments to avoid repetition
    const comments = await client.comments.list(post.id, { sort: 'top', limit: 10 });
    console.log(`  Existing comments: ${comments.length}`);
    
    if (dryRun) {
      console.log('  [DRY RUN] Would upvote and consider commenting');
    } else {
      // Upvote
      await client.posts.upvote(post.id);
      console.log('  ✓ Upvoted');
      
      // TODO: Generate thoughtful comment based on post and existing discussion
      // For now, just note that we'd comment here
      console.log('  (Skipping comment - implement comment generation logic)');
    }
    
    console.log();
  }
  
  // Rate limit info
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
