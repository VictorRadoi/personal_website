"""Generates the seamless paper-fiber tile (alpha WebP) used as a CSS background.
Usage: python3 paper_tile.py out.webp [size=384] [seed=1607] [quality=55] [alpha_quality=40]
Displayed at background-size: 384px (2x asset). Transparent, so it overlays any paper color."""
import sys, random, math
from PIL import Image, ImageDraw, ImageFilter
out = sys.argv[1]; N = int(sys.argv[2]) if len(sys.argv) > 2 else 768; seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1607
rnd = random.Random(seed)
DENSITY = float(sys.argv[6]) if len(sys.argv) > 6 else 0.7
SS = 2  # supersample
W = N * SS
img = Image.new('RGBA', (W, W), (0, 0, 0, 0))
def wrap_draw(fn, x, y, margin):
    for ox in (-W, 0, W):
        for oy in (-W, 0, W):
            if -margin <= x + ox <= W + margin and -margin <= y + oy <= W + margin:
                fn(x + ox, y + oy)
# pulp blotches (soft, very low alpha) on their own layer, blurred
blot = Image.new('RGBA', (W, W), (0, 0, 0, 0)); bd = ImageDraw.Draw(blot)
for _ in range(0):  # blotches disabled: alpha quantization turns them into hard spots
    x, y, r = rnd.uniform(0, W), rnd.uniform(0, W), rnd.uniform(80, 180) * SS / 2
    a = rnd.randint(8, 14)
    wrap_draw(lambda X, Y: bd.ellipse((X - r, Y - r, X + r, Y + r), fill=(120, 100, 60, a)), x, y, r)
blot = blot.filter(ImageFilter.GaussianBlur(40 * SS / 2))
img.alpha_composite(blot)
d = ImageDraw.Draw(img)
# fibers: short bent strokes
for i in range(int(1400 * DENSITY * (N / 384) ** 2)):
    x, y = rnd.uniform(0, W), rnd.uniform(0, W)
    L = rnd.uniform(3, 11) * SS; ang = rnd.uniform(0, math.pi)
    bend = rnd.uniform(-1.5, 1.5) * SS
    dark = rnd.random() < 0.6
    col = (29, 27, 24, int(255 * rnd.uniform(0.03, 0.07))) if dark else (255, 255, 255, int(255 * rnd.uniform(0.12, 0.22)))
    w = max(1, int(round(rnd.uniform(0.6, 1.1) * SS)))
    def fiber(X, Y):
        pts = []
        for t in [0, 0.25, 0.5, 0.75, 1]:
            px = X + math.cos(ang) * L * (t - 0.5) - math.sin(ang) * bend * (1 - (2 * t - 1) ** 2)
            py = Y + math.sin(ang) * L * (t - 0.5) + math.cos(ang) * bend * (1 - (2 * t - 1) ** 2)
            pts.append((px, py))
        d.line(pts, fill=col, width=w, joint='curve')
    wrap_draw(fiber, x, y, 14 * SS)
# specks
for i in range(int(2600 * DENSITY * 0.6 * (N / 384) ** 2)):
    x, y = rnd.uniform(0, W), rnd.uniform(0, W); r = rnd.uniform(0.3, 0.9) * SS
    a = int(255 * rnd.uniform(0.03, 0.07))
    wrap_draw(lambda X, Y: d.ellipse((X - r, Y - r, X + r, Y + r), fill=(29, 27, 24, a)), x, y, 2 * SS)
img = img.resize((N, N), Image.LANCZOS)
img.save(out, 'WEBP', quality=int(sys.argv[4]) if len(sys.argv) > 4 else 55, alpha_quality=int(sys.argv[5]) if len(sys.argv) > 5 else 40, method=6)
print(out, img.size)
