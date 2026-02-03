/**
 * ESM wrapper for OpenClaw Moltbook Skill
 * 
 * Provides ESM-compatible imports for modern agent frameworks
 */

import mod from './index.js';

export const {
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
} = mod;

export default mod;
