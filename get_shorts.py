import urllib.request
import re

try:
    html = urllib.request.urlopen('https://www.youtube.com/@flickdotstudio/shorts').read().decode('utf-8')
    shorts = list(set(re.findall(r'"videoId":"([^"]{11})"', html)))
    print("SHORTS:", shorts)
except Exception as e:
    print("Error:", e)
