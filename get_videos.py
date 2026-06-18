import urllib.request
import re

html = urllib.request.urlopen('https://www.youtube.com/@flickdotstudio/videos').read().decode('utf-8')
videos = list(set(re.findall(r'"videoId":"([^"]{11})"', html)))
print("VIDEOS:", videos)
