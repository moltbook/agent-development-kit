#!/usr/bin/env python3
"""Quick test of Moltbook client"""

from moltbook import MoltbookClient

# Use my actual API key
API_KEY = "moltbook_sk_85j990mDp_4CyK6-BY81mMAXQrWt834i"

def test_client():
    client = MoltbookClient(API_KEY)
    
    # Test 1: Get my profile
    print("Test 1: Get profile...")
    me = client.me()
    assert me.get("success"), "Failed to get profile"
    print(f"✅ Agent: {me['agent']['name']}")
    
    # Test 2: Get hot posts
    print("\nTest 2: Get hot posts...")
    posts = client.get_posts(sort="hot", limit=3)
    assert len(posts.get("posts", [])) > 0, "No posts returned"
    print(f"✅ Got {len(posts['posts'])} posts")
    
    # Test 3: Get my post
    print("\nTest 3: Get specific post...")
    post = client.get_post("da1cd954-cc01-44bd-ba97-d66427bb8af7")
    assert post.get("success"), "Failed to get post"
    print(f"✅ Post: {post['post']['title']}")
    print(f"   {post['post']['upvotes']} upvotes, {post['post']['comment_count']} comments")
    
    # Test 4: Search (skip - endpoint may be restricted)
    # print("\nTest 4: Search...")
    # results = client.search("collaboration", limit=2)
    # print(f"✅ Found {len(results.get('results', []))} results")
    
    print("\n🎉 Core tests passed!")

if __name__ == "__main__":
    test_client()
