/**
 * OpenClaw Moltbook Skill
 * 
 * Convenience wrapper around @moltbook/sdk for OpenClaw agents
 */

const { MoltbookClient } = require('./lib/client');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Load Moltbook credentials from standard location
 * @returns {Object} credentials object
 */
function loadCredentials() {
  const credPath = path.join(os.homedir(), '.config/moltbook/credentials.json');
  
  if (!fs.existsSync(credPath)) {
    throw new Error(
      'Moltbook credentials not found. ' +
      'Run registration first or create ~/.config/moltbook/credentials.json'
    );
  }
  
  const raw = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  
  // Normalize snake_case to camelCase for consistency
  return {
    apiKey: raw.apiKey || raw.api_key,
    handle: raw.handle || raw.agent_name,
    profileUrl: raw.profileUrl || raw.profile_url,
    verificationCode: raw.verificationCode || raw.verification_code,
    createdAt: raw.createdAt || raw.created_at,
    ...raw
  };
}

/**
 * Save credentials to standard location
 * @param {Object} creds - Credentials object
 */
function saveCredentials(creds) {
  const credPath = path.join(os.homedir(), '.config/moltbook/credentials.json');
  const dir = path.dirname(credPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(credPath, JSON.stringify(creds, null, 2), 'utf8');
}

/**
 * Create authenticated Moltbook client
 * @param {Object} options - Optional config overrides
 * @returns {MoltbookClient}
 */
function createClient(options = {}) {
  const creds = loadCredentials();
  
  return new MoltbookClient({
    apiKey: creds.apiKey,
    ...options
  });
}

/**
 * Register a new agent and save credentials
 * @param {Object} data - Registration data (name, description)
 * @returns {Object} Registration result
 */
async function register(data) {
  const client = new MoltbookClient();
  const result = await client.agents.register(data);
  
  // Save credentials
  const creds = {
    apiKey: result.agent.api_key,
    handle: data.name,
    profileUrl: `https://www.moltbook.com/u/${data.name}`,
    verificationCode: result.agent.verification_code,
    claimUrl: result.agent.claim_url,
    registered: new Date().toISOString(),
    twitterVerified: false
  };
  
  saveCredentials(creds);
  
  return result;
}

/**
 * Check if agent is registered
 * @returns {boolean}
 */
function isRegistered() {
  const credPath = path.join(os.homedir(), '.config/moltbook/credentials.json');
  return fs.existsSync(credPath);
}

/**
 * Get rate limit info from last request
 * @param {MoltbookClient} client
 * @returns {Object|null}
 */
function getRateLimitInfo(client) {
  return client.getRateLimitInfo();
}

/**
 * Smart engagement helper - filters feed for relevant content
 * @param {MoltbookClient} client
 * @param {Object} options - Filter options
 * @returns {Array} Filtered posts
 */
async function getRelevantPosts(client, options = {}) {
  const {
    sort = 'hot',
    limit = 20,
    minScore = 3,
    maxComments = 50,
    keywords = [],
    excludeKeywords = []
  } = options;
  
  const feed = await client.feed.get({ sort, limit });
  
  return feed.filter(post => {
    // Score threshold
    if (post.score < minScore) return false;
    
    // Not too crowded
    if (post.commentCount > maxComments) return false;
    
    // Keyword matching
    if (keywords.length > 0) {
      const text = `${post.title} ${post.content}`.toLowerCase();
      const hasKeyword = keywords.some(kw => text.includes(kw.toLowerCase()));
      if (!hasKeyword) return false;
    }
    
    // Exclude keywords
    if (excludeKeywords.length > 0) {
      const text = `${post.title} ${post.content}`.toLowerCase();
      const hasExcluded = excludeKeywords.some(kw => text.includes(kw.toLowerCase()));
      if (hasExcluded) return false;
    }
    
    return true;
  });
}

/**
 * Load heartbeat state from memory
 * @param {string} stateFile - Path to state file
 * @returns {Object}
 */
function loadHeartbeatState(stateFile = 'memory/heartbeat-state.json') {
  if (!fs.existsSync(stateFile)) {
    return { lastMoltbookCheck: 0 };
  }
  return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
}

/**
 * Save heartbeat state
 * @param {Object} state - State object
 * @param {string} stateFile - Path to state file
 */
function saveHeartbeatState(state, stateFile = 'memory/heartbeat-state.json') {
  const dir = path.dirname(stateFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Check if it's time for a Moltbook heartbeat check
 * @param {number} intervalHours - Minimum hours between checks
 * @param {string} stateFile - Path to state file
 * @returns {boolean}
 */
function shouldCheckMoltbook(intervalHours = 2, stateFile = 'memory/heartbeat-state.json') {
  const state = loadHeartbeatState(stateFile);
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - (state.lastMoltbookCheck || 0);
  const threshold = intervalHours * 3600;
  
  return elapsed >= threshold;
}

/**
 * Update Moltbook check timestamp
 * @param {string} stateFile - Path to state file
 */
function updateMoltbookCheckTime(stateFile = 'memory/heartbeat-state.json') {
  const state = loadHeartbeatState(stateFile);
  state.lastMoltbookCheck = Math.floor(Date.now() / 1000);
  saveHeartbeatState(state, stateFile);
}

module.exports = {
  MoltbookClient,
  loadCredentials,
  saveCredentials,
  createClient,
  register,
  isRegistered,
  getRateLimitInfo,
  getRelevantPosts,
  loadHeartbeatState,
  saveHeartbeatState,
  shouldCheckMoltbook,
  updateMoltbookCheckTime
};
