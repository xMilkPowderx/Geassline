#!/usr/bin/env python3
"""Draw the Geassline cursor+wing mark into PNG and ICO files."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ELECTRON = ROOT / "desktop" / "electron"
PUBLIC = ROOT / "public"

BG = (9, 10, 11, 255)
PALE = (236, 236, 234, 255)
CRIMSON = (196, 92, 74, 255)


def rounded_mask(size: int, radius: int) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return m


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = max(int(size * 0.22), 2)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=BG)

    s = size / 32
    bar_w = max(round(2.4 * s), 2)
    bar_x = round(12.0 * s)
    bar_y = round(10.5 * s)
    bar_h = round(13.5 * s)
    d.rounded_rectangle((bar_x, bar_y, bar_x + bar_w, bar_y + bar_h), radius=max(bar_w // 2, 1), fill=PALE)

    caret_x = bar_x + bar_w + max(round(1.6 * s), 1)
    caret_w = max(round(6.2 * s), 3)
    caret_h = max(round(7.4 * s), 4)
    caret_y = bar_y + bar_h - caret_h
    d.rounded_rectangle(
        (caret_x, caret_y, caret_x + caret_w, caret_y + caret_h),
        radius=max(int(0.8 * s), 1),
        fill=CRIMSON,
    )

    cx = bar_x + bar_w * 0.5
    top = round(6.2 * s)
    span = round(7.2 * s)
    thick = max(round(1.6 * s), 2)
    left = (cx - span, round(11.4 * s))
    right = (cx + span, round(11.4 * s))
    peak = (cx, top)
    d.line([left, peak], fill=CRIMSON, width=thick)
    d.line([right, peak], fill=CRIMSON, width=thick)
    r = max(thick // 2, 1)
    for pt in (left, right, peak):
        d.ellipse((pt[0] - r, pt[1] - r, pt[0] + r, pt[1] + r), fill=CRIMSON)

    img.putalpha(rounded_mask(size, radius))
    return img


def main() -> None:
    ELECTRON.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    images = {n: draw_icon(n) for n in (16, 24, 32, 48, 64, 128, 256, 512)}
    images[256].save(ELECTRON / "icon.png")
    images[256].save(
        ELECTRON / "icon.ico",
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    (PUBLIC / "favicon.svg").write_text(
        """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#090a0b"/>
  <rect x="12" y="10.5" width="2.4" height="13.5" rx="1.2" fill="#ececea"/>
  <rect x="16" y="16.6" width="6.2" height="7.4" rx="1.2" fill="#c45c4a"/>
  <path d="M8.8 11.4 L13.2 6.2 L17.6 11.4" fill="none" stroke="#c45c4a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
"""
    )
    print("wrote", ELECTRON / "icon.ico")
    print("wrote", ELECTRON / "icon.png")
    print("wrote", PUBLIC / "favicon.svg")


if __name__ == "__main__":
    main()
