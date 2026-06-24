import urllib.request
from PIL import Image
import os
import io
import random

# Only horizontal (regular) videos, excluding shorts
videos = [
    "Uz4Qa37LEKk", "GX1vz0T-dIE", "j20LIzXytJ4", "OBAeyeYSjFQ", "LtOwx_tqJsw", "AvqXCOoCbhw", "XUoYZ5NtKvU", "DgTIKX1CX_g", "WvWD5SugQko", "sL3Pn-Ej5dY", "M2G2soaLPu8", "865eMrWxhTw", "29-CXj5peNM", "m3OvTVPoLUk", "pM_fZtqlks8", "6mBtt8anFh4", "gbb8irtXXv0", "YDtMNjmKjZ4", "0PMFiY3zf9c", "qqX6WUxLMzo", "vad_E5qZXlU", "OIJz6WIvwiw", "tOMUUTf4Rks", "Gc0f6a8ZHQo", "JoFS0bvIXlU", "bAG9roUmlUs", "IGpCJpjIPOs", "Bt46ajXQN-w", "es6ahdjbKxU", "Fz-vuHgHOxM", "fQYnv5PDi78", "Jee5zxUbQr0", "kTmj696cmiM", "yCJIE74w79E", "BY6PAUWj0uY", "dPycSyX7xww", "QUIZSF2BOI0", "wmkuxE1KcAU", "4ZUKk8ZHQWQ", "KErd9s_Cr1I", "BT7IZee-aD8", "JQ621T_PN0s", "L7aRxqziN8w", "xGL5xy_YFyw", "U07SsCE6ZJA", "MR72FmMVffk", "C-a0jpFHizc", "ESJcH-bSONQ"
]

# Shuffle for random look
random.seed(999)
random.shuffle(videos)

# To make thumbnails appear smaller on screen and fix clarity, we generate a massive 5K image (5120x2880)
# We will use 32 columns and 32 rows, packing 1024 tiny thumbnails.
thumbnail_width = 160
thumbnail_height = 90

cols = 32
rows = 32

needed = cols * rows
while len(videos) < needed:
    videos.extend(videos)

wallpaper_width = cols * thumbnail_width
wallpaper_height = rows * thumbnail_height

wallpaper = Image.new('RGB', (wallpaper_width, wallpaper_height))

# Pre-fetch and cache images in memory
image_cache = {}

idx = 0
for r in range(rows):
    for c in range(cols):
        vid = videos[idx]
        
        if vid not in image_cache:
            url = f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg"
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                data = urllib.request.urlopen(req).read()
                # Downsampling mqdefault from 320x180 to 160x90 using LANCZOS for maximum clarity
                img = Image.open(io.BytesIO(data))
                img = img.resize((thumbnail_width, thumbnail_height), Image.Resampling.LANCZOS)
                image_cache[vid] = img
            except Exception as e:
                image_cache[vid] = Image.new('RGB', (thumbnail_width, thumbnail_height), color='black')
        
        wallpaper.paste(image_cache[vid], (c * thumbnail_width, r * thumbnail_height))
        idx += 1

output_path = os.path.join("public", "images", "youtube_grid_5k.png")
wallpaper.save(output_path, quality=95)
print(f"Wallpaper generated and saved to {output_path}")
