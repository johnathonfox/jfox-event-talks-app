import requests
import feedparser

url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
try:
    response = requests.get(url, timeout=10)
    print("Status code:", response.status_code)
    feed = feedparser.parse(response.content)
    print("Feed Title:", feed.feed.get('title'))
    print("Number of entries:", len(feed.entries))
    if len(feed.entries) > 0:
        entry = feed.entries[0]
        print("First entry keys:", entry.keys())
        print("First entry title:", entry.get('title'))
        print("First entry link:", entry.get('link'))
        print("First entry updated:", entry.get('updated'))
        print("First entry summary:", entry.get('summary')[:300] if entry.get('summary') else None)
except Exception as e:
    print("Error:", e)
