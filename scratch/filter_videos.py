import urllib.request
import json

video_ids = ["Uz4Qa37LEKk", "GX1vz0T-dIE", "j20LIzXytJ4", "OBAeyeYSjFQ", "LtOwx_tqJsw", "AvqXCOoCbhw", "XUoYZ5NtKvU", "DgTIKX1CX_g", "WvWD5SugQko", "sL3Pn-Ej5dY", "M2G2soaLPu8", "865eMrWxhTw", "29-CXj5peNM", "m3OvTVPoLUk", "pM_fZtqlks8", "6mBtt8anFh4", "1pwbabgcVkQ", "gbb8irtXXv0", "NxzjEwBlzeM", "YDtMNjmKjZ4", "0PMFiY3zf9c", "qqX6WUxLMzo", "vad_E5qZXlU", "3MGKaDs-0wA", "ucTLig0Fb5E", "OIJz6WIvwiw", "xUFLPav7rPw", "CkcC9Ze-vUY", "tOMUUTf4Rks", "Gc0f6a8ZHQo", "xfGuxJCEd5k", "JoFS0bvIXlU", "vZNHPac5hJY", "ImgQFaZ-Dqc", "bAG9roUmlUs", "IGpCJpjIPOs", "Bt46ajXQN-w", "hWdyQ5wfpn4", "es6ahdjbKxU", "Fz-vuHgHOxM", "fQYnv5PDi78", "Jee5zxUbQr0", "kTmj696cmiM", "yCJIE74w79E", "BY6PAUWj0uY", "dPycSyX7xww", "QUIZSF2BOI0", "wmkuxE1KcAU", "DmhcU7tzQ_Q", "4ZUKk8ZHQWQ", "KErd9s_Cr1I", "5yRXHMHCqb8", "BT7IZee-aD8", "JQ621T_PN0s", "L7aRxqziN8w", "xGL5xy_YFyw", "U07SsCE6ZJA", "MR72FmMVffk", "C-a0jpFHizc", "ESJcH-bSONQ"]

normal = []
shorts = []

# Using a HEAD request to /shorts/ID. If it redirects to /watch, it's normal. If it stays /shorts, it's a short.
class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirectHandler())

for vid in video_ids:
    url = f"https://www.youtube.com/shorts/{vid}"
    req = urllib.request.Request(url, method='HEAD')
    try:
        resp = opener.open(req)
        # If no exception, it didn't redirect. Status 200 = it's a short.
        if resp.status == 200:
            shorts.append(vid)
    except urllib.error.HTTPError as e:
        # 303 See Other means it redirected to /watch?v=...
        if e.code in (301, 302, 303):
            normal.append(vid)
        else:
            normal.append(vid)

print("NORMAL:")
print(json.dumps(normal))
print("SHORTS:")
print(json.dumps(shorts))
