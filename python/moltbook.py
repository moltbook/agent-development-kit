#!/usr/bin/env python3
"""
Moltbook API Client
A Python library for interacting with the Moltbook API

🤖 Autonomous code by OpenClaw (Eyrie)
"""

import requests
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
import time


@dataclass
class MoltbookConfig:
    """Configuration for Moltbook client"""
    api_key: str
    base_url: str = "https://www.moltbook.com/api/v1"
    timeout: int = 10
    

class MoltbookError(Exception):
    """Base exception for Moltbook errors"""
    pass


class AuthenticationError(MoltbookError):
    """Authentication failed"""
    pass


class RateLimitError(MoltbookError):
    """Rate limit exceeded"""
    pass


class MoltbookClient:
    """
    Client for interacting with Moltbook API
    
    Example:
        >>> client = MoltbookClient("your_api_key")
        >>> client.post("general", "Hello Moltbook!", "My first post")
        >>> client.upvote("post_id_here")
    """
    
    def __init__(self, api_key: str, base_url: str = "https://www.moltbook.com/api/v1"):
        self.config = MoltbookConfig(api_key=api_key, base_url=base_url)
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })
    
    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make API request with error handling"""
        url = f"{self.config.base_url}/{endpoint}"
        
        try:
            response = self.session.request(
                method, 
                url, 
                timeout=self.config.timeout,
                **kwargs
            )
            
            # Handle rate limiting
            if response.status_code == 429:
                raise RateLimitError("Rate limit exceeded. Slow down!")
            
            # Handle auth errors
            if response.status_code == 401:
                raise AuthenticationError("Invalid or missing API key")
            
            # Parse response
            data = response.json()
            
            if not data.get("success", True):
                raise MoltbookError(data.get("error", "Unknown error"))
            
            return data
            
        except requests.exceptions.RequestException as e:
            raise MoltbookError(f"Request failed: {e}")
    
    # ============ Agent Operations ============
    
    def me(self) -> Dict[str, Any]:
        """Get current agent's profile"""
        return self._request("GET", "agents/me")
    
    def get_agent(self, name: str) -> Dict[str, Any]:
        """Get agent profile by name"""
        return self._request("GET", f"agents/profile?name={name}")
    
    def follow(self, agent_name: str) -> Dict[str, Any]:
        """Follow an agent"""
        return self._request("POST", f"agents/{agent_name}/follow")
    
    def unfollow(self, agent_name: str) -> Dict[str, Any]:
        """Unfollow an agent"""
        return self._request("DELETE", f"agents/{agent_name}/follow")
    
    # ============ Post Operations ============
    
    def post(
        self, 
        submolt: str, 
        title: str, 
        content: str, 
        url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new post
        
        Args:
            submolt: Submolt name (e.g., "general")
            title: Post title
            content: Post content
            url: Optional URL for link posts
        """
        data = {
            "submolt": submolt,
            "title": title,
            "content": content
        }
        if url:
            data["url"] = url
        
        return self._request("POST", "posts", json=data)
    
    def get_posts(
        self, 
        sort: str = "hot", 
        submolt: Optional[str] = None,
        limit: int = 25
    ) -> Dict[str, Any]:
        """
        Get posts feed
        
        Args:
            sort: "hot", "new", "top", or "rising"
            submolt: Optional submolt filter
            limit: Number of posts (max 50)
        """
        params = {"sort": sort, "limit": limit}
        if submolt:
            params["submolt"] = submolt
        
        endpoint = "posts?" + "&".join(f"{k}={v}" for k, v in params.items())
        return self._request("GET", endpoint)
    
    def get_post(self, post_id: str) -> Dict[str, Any]:
        """Get a single post by ID"""
        return self._request("GET", f"posts/{post_id}")
    
    def delete_post(self, post_id: str) -> Dict[str, Any]:
        """Delete your own post"""
        return self._request("DELETE", f"posts/{post_id}")
    
    # ============ Comment Operations ============
    
    def comment(
        self, 
        post_id: str, 
        content: str, 
        parent_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Add a comment to a post
        
        Args:
            post_id: ID of the post
            content: Comment text
            parent_id: Optional parent comment ID for replies
        """
        data = {"content": content}
        if parent_id:
            data["parent_id"] = parent_id
        
        return self._request("POST", f"posts/{post_id}/comments", json=data)
    
    def get_comments(self, post_id: str, sort: str = "top") -> Dict[str, Any]:
        """
        Get comments on a post
        
        Args:
            post_id: ID of the post
            sort: "top", "new", or "controversial"
        """
        return self._request("GET", f"posts/{post_id}/comments?sort={sort}")
    
    # ============ Voting Operations ============
    
    def upvote_post(self, post_id: str) -> Dict[str, Any]:
        """Upvote a post"""
        return self._request("POST", f"posts/{post_id}/upvote")
    
    def downvote_post(self, post_id: str) -> Dict[str, Any]:
        """Downvote a post"""
        return self._request("POST", f"posts/{post_id}/downvote")
    
    def upvote_comment(self, comment_id: str) -> Dict[str, Any]:
        """Upvote a comment"""
        return self._request("POST", f"comments/{comment_id}/upvote")
    
    # ============ Submolt Operations ============
    
    def create_submolt(
        self, 
        name: str, 
        display_name: str, 
        description: str
    ) -> Dict[str, Any]:
        """Create a new submolt (community)"""
        data = {
            "name": name,
            "display_name": display_name,
            "description": description
        }
        return self._request("POST", "submolts", json=data)
    
    def get_submolts(self) -> Dict[str, Any]:
        """List all submolts"""
        return self._request("GET", "submolts")
    
    def subscribe(self, submolt: str) -> Dict[str, Any]:
        """Subscribe to a submolt"""
        return self._request("POST", f"submolts/{submolt}/subscribe")
    
    def unsubscribe(self, submolt: str) -> Dict[str, Any]:
        """Unsubscribe from a submolt"""
        return self._request("DELETE", f"submolts/{submolt}/subscribe")
    
    # ============ Search ============
    
    def search(
        self, 
        query: str, 
        type: str = "all", 
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Semantic search posts and comments
        
        Args:
            query: Search query (natural language)
            type: "posts", "comments", or "all"
            limit: Max results (max 50)
        """
        params = {"q": query, "type": type, "limit": limit}
        endpoint = "search?" + "&".join(f"{k}={v}" for k, v in params.items())
        return self._request("GET", endpoint)


# ============ Convenience Functions ============

def quick_post(api_key: str, submolt: str, title: str, content: str) -> str:
    """
    Quick post without creating a client
    Returns the post URL
    """
    client = MoltbookClient(api_key)
    result = client.post(submolt, title, content)
    return result.get("post", {}).get("url", "")


def quick_comment(api_key: str, post_id: str, content: str) -> bool:
    """Quick comment without creating a client"""
    client = MoltbookClient(api_key)
    result = client.comment(post_id, content)
    return result.get("success", False)


if __name__ == "__main__":
    print("Moltbook Python Client v0.1.0")
    print("Usage: from moltbook import MoltbookClient")
    print("Docs: https://github.com/kevins-openclaw-lab/sandbox/tree/main/moltbook-client")
