"""Extract individual card PNGs from composite card images."""
from PIL import Image
import numpy as np
import os

BASE = "c:/Code/2048-custom-pwa/cube-swipe/public"
OUT = os.path.join(BASE, "cards")
os.makedirs(OUT, exist_ok=True)


def find_card_bounds(img_array, axis, threshold=240, min_gap=5):
    """Find card boundaries by detecting whitespace gaps along an axis.

    axis=1 for columns (horizontal splits), axis=0 for rows (vertical splits).
    Returns list of (start, end) pixel ranges for each card.
    """
    # Average brightness along the axis
    if len(img_array.shape) == 3:
        gray = np.mean(img_array, axis=2)
    else:
        gray = img_array.astype(float)

    # Project to 1D: for columns, average across rows; for rows, average across columns
    if axis == 1:
        profile = np.mean(gray, axis=0)
    else:
        profile = np.mean(gray, axis=1)

    # Find positions that are "white" (likely gaps between cards)
    is_gap = profile > threshold

    # Find contiguous non-gap regions (cards)
    regions = []
    in_card = False
    start = 0
    for i, gap in enumerate(is_gap):
        if not gap and not in_card:
            start = i
            in_card = True
        elif gap and in_card:
            if i - start > min_gap:
                regions.append((start, i))
            in_card = False
    if in_card:
        regions.append((start, len(is_gap)))

    return regions


def extract_grid(filename, expected_cols, expected_rows, names):
    """Extract cards from a grid image."""
    path = os.path.join(BASE, filename)
    img = Image.open(path).convert("RGBA")
    arr = np.array(img.convert("RGB"))

    print(f"\n--- {filename} ({img.size[0]}x{img.size[1]}) ---")

    # Find column and row boundaries
    col_regions = find_card_bounds(arr, axis=1, threshold=235, min_gap=8)
    row_regions = find_card_bounds(arr, axis=0, threshold=235, min_gap=8)

    print(f"  Detected {len(col_regions)} columns, {len(row_regions)} rows")

    # Fall back to even division if detection fails
    if len(col_regions) != expected_cols:
        print(f"  Column detection off (got {len(col_regions)}, expected {expected_cols}), using even division")
        w = img.size[0]
        cw = w / expected_cols
        col_regions = [(int(i * cw), int((i + 1) * cw)) for i in range(expected_cols)]

    if len(row_regions) != expected_rows:
        print(f"  Row detection off (got {len(row_regions)}, expected {expected_rows}), using even division")
        h = img.size[1]
        ch = h / expected_rows
        row_regions = [(int(i * ch), int((i + 1) * ch)) for i in range(expected_rows)]

    print(f"  Columns: {col_regions}")
    print(f"  Rows: {row_regions}")

    idx = 0
    for r, (y1, y2) in enumerate(row_regions):
        for c, (x1, x2) in enumerate(col_regions):
            if idx >= len(names):
                break

            # Crop the card region
            card = img.crop((x1, y1, x2, y2))

            # Auto-trim whitespace/transparency around the card
            card_rgb = card.convert("RGB")
            card_arr = np.array(card_rgb)

            # Find non-white bounding box (threshold slightly below pure white)
            mask = np.any(card_arr < 235, axis=2)
            if mask.any():
                rows_with_content = np.where(mask.any(axis=1))[0]
                cols_with_content = np.where(mask.any(axis=0))[0]
                if len(rows_with_content) > 0 and len(cols_with_content) > 0:
                    pad = 2  # small padding
                    top = max(0, rows_with_content[0] - pad)
                    bottom = min(card.size[1], rows_with_content[-1] + pad + 1)
                    left = max(0, cols_with_content[0] - pad)
                    right = min(card.size[0], cols_with_content[-1] + pad + 1)
                    card = card.crop((left, top, right, bottom))

            name = names[idx]
            out_path = os.path.join(OUT, f"{name}.png")
            card.save(out_path, "PNG")
            print(f"  [{idx+1}] {name}.png  ({card.size[0]}x{card.size[1]})")
            idx += 1


# --- 10Cards.png: 5×2 property cards ---
property_names = [
    # Row 1 (top): brown, light-blue, pink, orange, railroad
    "prop-mediterranean", "prop-connecticut", "prop-st-charles", "prop-st-james", "prop-reading-rr",
    # Row 2 (bottom): red, yellow, green, dark-blue, utility
    "prop-kentucky", "prop-atlantic", "prop-north-carolina", "prop-boardwalk", "prop-water-works",
]
extract_grid("10Cards.png", 5, 2, property_names)

# --- 6Cards.png: 3×2 wild cards ---
wild_names = [
    # Row 1
    "wild-brown-lightblue", "wild-pink-orange", "wild-red-yellow",
    # Row 2
    "wild-green-darkblue", "wild-railroad-utility", "wild-rainbow",
]
extract_grid("6Cards.png", 3, 2, wild_names)

# --- 12Cards.png: 4×3 action cards ---
action_names = [
    # Row 1
    "action-sly-deal", "action-forced-deal", "action-deal-breaker", "action-debt-collector",
    # Row 2
    "action-just-say-no", "action-birthday", "action-rent-multi", "action-rent-2color",
    # Row 3
    "action-double-rent", "action-pass-go", "action-house", "action-hotel",
]
extract_grid("12Cards.png", 4, 3, action_names)

print(f"\nDone! Extracted {len(property_names) + len(wild_names) + len(action_names)} cards to {OUT}")
