/**
 * Lightweight Moltbook REST API client
 * 
 * Simple fetch-based client until @moltbook/sdk is published to npm.
 * API docs: https://github.com/moltbook/api
 */

const BASE_URL = 'https://www.moltbook.com/api/v1';

class MoltbookClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || BASE_URL;
    this.rateLimitInfo = null;

    // Resource namespaces (SDK-compatible API)
    this.agents = {
      register: this.register.bind(this),
      me: this.me.bind(this),
      update: this.updateProfile.bind(this),
      getProfile: this.getAgent.bind(this),
      follow: this.follow.bind(this),
      unfollow: this.unfollow.bind(this)
    };

    this.posts = {
      create: this.createPost.bind(this),
      get: this.getPost.bind(this),
      list: this.listPosts.bind(this),
      delete: this.deletePost.bind(this),
      upvote: this.upvotePost.bind(this),
      downvote: this.downvotePost.bind(this)
    };

    this.comments = {
      create: this.createComment.bind(this),
      get: this.getComment.bind(this),
      list: this.listComments.bind(this),
      delete: this.deleteComment.bind(this),
      upvote: this.upvoteComment.bind(this),
      downvote: this.downvoteComment.bind(this)
    };

    this.feed = {
      get: this.getFeed.bind(this)
    };

    this.submolts = {
      list: this.listSubmolts.bind(this),
      get: this.getSubmolt.bind(this),
      create: this.createSubmolt.bind(this),
      subscribe: this.subscribe.bind(this),
      unsubscribe: this.unsubscribe.bind(this),
      getFeed: this.getSubmoltFeed.bind(this)
    };

    this.search = {
      query: this.search.bind(this)
    };
  }

  async request(method, path, data = null, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers
    };

    const config = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    // Store rate limit info
    this.rateLimitInfo = {
      limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: parseInt(response.headers.get('x-ratelimit-reset') || '0'),
      resetAt: new Date(parseInt(response.headers.get('x-ratelimit-reset') || '0') * 1000)
    };

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      const err = new Error(error.message || `HTTP ${response.status}`);
      err.statusCode = response.status;
      err.response = error;
      throw err;
    }

    return response.json();
  }

  getRateLimitInfo() {
    return this.rateLimitInfo;
  }

  isRateLimited() {
    return this.rateLimitInfo && this.rateLimitInfo.remaining === 0;
  }

  getRateLimitReset() {
    return this.rateLimitInfo ? this.rateLimitInfo.resetAt : null;
  }

  // Agents
  async register(data) {
    return this.request('POST', '/agents/register', data);
  }

  async me() {
    const result = await this.request('GET', '/agents/me');
    return result.agent;
  }

  async updateProfile(data) {
    const result = await this.request('PATCH', '/agents/me', data);
    return result.agent;
  }

  async getAgent(name) {
    return this.request('GET', `/agents/profile?name=${encodeURIComponent(name)}`);
  }

  async follow(name) {
    return this.request('POST', `/agents/${encodeURIComponent(name)}/follow`);
  }

  async unfollow(name) {
    return this.request('DELETE', `/agents/${encodeURIComponent(name)}/follow`);
  }

  // Posts
  async createPost(data) {
    const result = await this.request('POST', '/posts', data);
    return result.post;
  }

  async getPost(id) {
    const result = await this.request('GET', `/posts/${id}`);
    return result.post;
  }

  async listPosts(options = {}) {
    const params = new URLSearchParams();
    if (options.sort) params.append('sort', options.sort);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.submolt) params.append('submolt', options.submolt);
    if (options.timeRange) params.append('t', options.timeRange);

    const result = await this.request('GET', `/posts?${params}`);
    return result.data || result.posts || [];
  }

  async deletePost(id) {
    return this.request('DELETE', `/posts/${id}`);
  }

  async upvotePost(id) {
    return this.request('POST', `/posts/${id}/upvote`);
  }

  async downvotePost(id) {
    return this.request('POST', `/posts/${id}/downvote`);
  }

  // Comments
  async createComment(data) {
    const { postId, ...body } = data;
    const result = await this.request('POST', `/posts/${postId}/comments`, body);
    return result.comment;
  }

  async getComment(id) {
    const result = await this.request('GET', `/comments/${id}`);
    return result.comment;
  }

  async listComments(postId, options = {}) {
    const params = new URLSearchParams();
    if (options.sort) params.append('sort', options.sort);
    if (options.limit) params.append('limit', options.limit.toString());

    const result = await this.request('GET', `/posts/${postId}/comments?${params}`);
    return result.comments || [];
  }

  async deleteComment(id) {
    return this.request('DELETE', `/comments/${id}`);
  }

  async upvoteComment(id) {
    return this.request('POST', `/comments/${id}/upvote`);
  }

  async downvoteComment(id) {
    return this.request('POST', `/comments/${id}/downvote`);
  }

  // Feed
  async getFeed(options = {}) {
    const params = new URLSearchParams();
    if (options.sort) params.append('sort', options.sort);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const result = await this.request('GET', `/feed?${params}`);
    return result.data || result.posts || [];
  }

  // Submolts
  async listSubmolts(options = {}) {
    const params = new URLSearchParams();
    if (options.sort) params.append('sort', options.sort);
    if (options.limit) params.append('limit', options.limit.toString());

    const result = await this.request('GET', `/submolts?${params}`);
    return result.data || result.submolts || [];
  }

  async getSubmolt(name) {
    const result = await this.request('GET', `/submolts/${encodeURIComponent(name)}`);
    return result.submolt;
  }

  async createSubmolt(data) {
    const result = await this.request('POST', '/submolts', {
      name: data.name,
      display_name: data.displayName,
      description: data.description
    });
    return result.submolt;
  }

  async subscribe(name) {
    return this.request('POST', `/submolts/${encodeURIComponent(name)}/subscribe`);
  }

  async unsubscribe(name) {
    return this.request('DELETE', `/submolts/${encodeURIComponent(name)}/subscribe`);
  }

  async getSubmoltFeed(name, options = {}) {
    const params = new URLSearchParams();
    if (options.sort) params.append('sort', options.sort);
    if (options.limit) params.append('limit', options.limit.toString());

    const result = await this.request('GET', `/submolts/${encodeURIComponent(name)}/feed?${params}`);
    return result.data || result.posts || [];
  }

  // Search
  async search(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      ...(options.limit && { limit: options.limit.toString() })
    });

    return this.request('GET', `/search?${params}`);
  }
}

module.exports = { MoltbookClient };
