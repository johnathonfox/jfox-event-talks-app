import os
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, render_template, jsonify, request
from datetime import datetime

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache for feed data
cache = {
    "data": None,
    "last_fetched": None
}

def clean_html_for_text(html_content):
    """Converts HTML content to clean plain text for tweets."""
    soup = BeautifulSoup(html_content, 'html.parser')
    # Replace links with text (URL)
    for a in soup.find_all('a'):
        href = a.get('href', '')
        if href:
            a.replace_with(f"{a.get_text()} ({href})")
    
    # Get text and clean up whitespace
    text = soup.get_text()
    # Normalize spaces and newlines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return " ".join(lines)

def parse_release_feed(force_refresh=False):
    """Fetches and parses the BigQuery release notes RSS feed."""
    now = datetime.now()
    
    # Return cached data if available and fresh (less than 10 minutes old)
    if not force_refresh and cache["data"] and cache["last_fetched"]:
        time_diff = (now - cache["last_fetched"]).total_seconds()
        if time_diff < 600:  # 10 minutes
            return cache["data"], False

    try:
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
        
        feed = feedparser.parse(response.content)
        updates = []
        
        for idx, entry in enumerate(feed.entries):
            entry_title = entry.get('title', 'Unknown Date')
            entry_link = entry.get('link', 'https://cloud.google.com/bigquery/docs/release-notes')
            entry_id = entry.get('id', f"entry_{idx}")
            summary_html = entry.get('summary', '')
            
            if not summary_html:
                continue
                
            soup = BeautifulSoup(summary_html, 'html.parser')
            
            current_type = "Update"
            current_content = []
            sub_idx = 0
            
            # Helper function to append parsed update
            def add_update(update_type, html_list):
                nonlocal sub_idx
                if not html_list:
                    return
                html_str = "".join(str(c) for c in html_list).strip()
                # Skip if empty
                if not html_str or html_str == "<p></p>":
                    return
                
                plain_text = clean_html_for_text(html_str)
                
                updates.append({
                    "id": f"{entry_id}_{sub_idx}",
                    "date": entry_title,
                    "type": update_type,
                    "content_html": html_str,
                    "content_text": plain_text,
                    "link": entry_link
                })
                sub_idx += 1

            for child in soup.children:
                if child.name == 'h3':
                    # Save the previous block before starting a new one
                    add_update(current_type, current_content)
                    current_content = []
                    current_type = child.get_text().strip()
                else:
                    current_content.append(child)
            
            # Add final block
            add_update(current_type, current_content)
            
        cache["data"] = updates
        cache["last_fetched"] = now
        return updates, True
        
    except Exception as e:
        print(f"Error fetching feed: {e}")
        # If fetch fails, return cached data if we have it, else raise error
        if cache["data"]:
            return cache["data"], False
        raise e

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        data, refetched = parse_release_feed(force_refresh=force_refresh)
        return jsonify({
            "status": "success",
            "refetched": refetched,
            "count": len(data),
            "data": data
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch release notes: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Default Flask port is 5000, let's run locally
    app.run(host='127.0.0.1', port=5000, debug=True)
