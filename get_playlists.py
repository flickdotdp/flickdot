import urllib.request
import re
import json

try:
    html = urllib.request.urlopen('https://www.youtube.com/@flickdotstudio/playlists').read().decode('utf-8')
    
    # Try to extract ytInitialData
    match = re.search(r'var ytInitialData = ({.*?});</script>', html)
    if match:
        data = json.loads(match.group(1))
        # Recursive search for playlists
        def find_playlists(obj):
            playlists = []
            if isinstance(obj, dict):
                if 'playlistId' in obj and 'title' in obj and isinstance(obj['title'], dict) and 'simpleText' in obj['title']:
                    playlists.append((obj['title']['simpleText'], obj['playlistId']))
                for k, v in obj.items():
                    playlists.extend(find_playlists(v))
            elif isinstance(obj, list):
                for item in obj:
                    playlists.extend(find_playlists(item))
            return playlists
            
        found = find_playlists(data)
        # Deduplicate by ID
        unique = {}
        for title, pid in found:
            if pid not in unique and pid != "WL":
                unique[pid] = title
        print("PLAYLISTS:", unique)
    else:
        print("ytInitialData not found.")
except Exception as e:
    print("Error:", e)
