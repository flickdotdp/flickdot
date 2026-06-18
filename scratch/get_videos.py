import urllib.request
import re
import json

url = 'https://www.youtube.com/@flickdotstudio'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    video_ids = list(set(re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)))
    print(json.dumps(video_ids))
except Exception as e:
    print(f"Error: {e}")
