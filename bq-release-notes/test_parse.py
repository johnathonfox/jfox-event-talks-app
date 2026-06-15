import requests
import feedparser
from bs4 import BeautifulSoup

url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
response = requests.get(url, timeout=10)
feed = feedparser.parse(response.content)

for entry in feed.entries[:3]:
    print("--- ENTRY:", entry.title, "---")
    summary_html = entry.get('summary', '')
    soup = BeautifulSoup(summary_html, 'html.parser')
    
    # We want to segment the HTML by <h3> elements
    current_type = "Update"
    current_content = []
    
    # Let's iterate through child elements
    for child in soup.children:
        if child.name == 'h3':
            if current_content:
                print(f"[{current_type}]:", "".join(str(c) for c in current_content).strip())
                current_content = []
            current_type = child.get_text().strip()
        else:
            current_content.append(child)
            
    if current_content:
        print(f"[{current_type}]:", "".join(str(c) for c in current_content).strip())
