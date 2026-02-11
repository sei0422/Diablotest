#!/usr/bin/env python3
"""
Compose FLARE avatar sprite layers into grid-based sprite sheets for Diablotest.

Reads FLARE packed-atlas animation definitions (.txt) and source PNGs,
composites multiple equipment layers, and outputs a regular grid sprite sheet.

Output format: 1024x1024 PNG (8 cols x 8 rows, 128x128 cells)
- Rows = directions (S, SW, W, NW, N, NE, E, SE) matching game's dir system
- Cols = animation frames (run: 8 frames)
"""

import os
import re
import sys
from PIL import Image

FLARE_BASE = "/tmp/flare-game/mods/fantasycore"
ANIM_DIR = os.path.join(FLARE_BASE, "animations/avatar")
IMG_DIR = os.path.join(FLARE_BASE, "images/avatar")
OUTPUT_DIR = "/Users/sei/Diablotest/asset/sprite_sheets"

CELL_SIZE = 128
RENDER_OFFSET_X = 64
RENDER_OFFSET_Y = 96

# FLARE directions: 0=E, 1=SE, 2=S, 3=SW, 4=W, 5=NW, 6=N, 7=NE
# OGA creature sheets use FLARE order directly (OGA_DIR_REMAP = identity)
# So player sprites must also use FLARE order to match
GAME_TO_FLARE_DIR = [0, 1, 2, 3, 4, 5, 6, 7]  # identity = FLARE order


def parse_animation_file(txt_path, gender="male"):
    """Parse a FLARE animation .txt file and extract frame definitions."""
    animations = {}
    current_anim = None
    image_path = None

    with open(txt_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            if line.startswith('image='):
                rel_path = line.split('=', 1)[1]
                image_path = os.path.join(FLARE_BASE, rel_path)
                continue

            m = re.match(r'^\[(\w+)\]$', line)
            if m:
                current_anim = m.group(1)
                animations[current_anim] = {
                    'frames_count': 0,
                    'duration': 0,
                    'type': '',
                    'frames': {}  # (frame_idx, direction) -> (x, y, w, h, off_x, off_y)
                }
                continue

            if current_anim:
                if line.startswith('frames='):
                    animations[current_anim]['frames_count'] = int(line.split('=')[1])
                elif line.startswith('duration='):
                    animations[current_anim]['duration'] = line.split('=')[1]
                elif line.startswith('type='):
                    animations[current_anim]['type'] = line.split('=')[1]
                elif line.startswith('frame='):
                    parts = line.split('=')[1].split(',')
                    frame_idx = int(parts[0])
                    direction = int(parts[1])
                    x, y, w, h = int(parts[2]), int(parts[3]), int(parts[4]), int(parts[5])
                    off_x, off_y = int(parts[6]), int(parts[7])
                    animations[current_anim]['frames'][(frame_idx, direction)] = (x, y, w, h, off_x, off_y)

    return image_path, animations


def render_frame(canvas, src_img, frame_data, cell_x, cell_y):
    """Render a single frame onto the canvas at the given cell position."""
    x, y, w, h, off_x, off_y = frame_data

    # Crop the frame from source
    if x < 0 or y < 0 or x + w > src_img.width or y + h > src_img.height:
        return  # Skip out-of-bounds
    if w <= 0 or h <= 0:
        return

    crop = src_img.crop((x, y, x + w, y + h))

    # Calculate destination position within the 128x128 cell
    dest_x = cell_x + RENDER_OFFSET_X - off_x
    dest_y = cell_y + RENDER_OFFSET_Y - off_y

    # Paste with alpha compositing
    canvas.paste(crop, (dest_x, dest_y), crop)


def compose_spritesheet(layer_configs, anim_name, output_path, gender="male"):
    """
    Compose a sprite sheet from multiple FLARE layers.

    layer_configs: list of layer file names (e.g., ['default_chest', 'clothes', 'longsword'])
    anim_name: animation to extract (e.g., 'run', 'stance', 'swing')
    """
    # Parse all layer animation files and load images
    layers = []
    for layer_name in layer_configs:
        txt_path = os.path.join(ANIM_DIR, gender, f"{layer_name}.txt")
        if not os.path.exists(txt_path):
            print(f"  WARNING: {txt_path} not found, skipping layer")
            continue

        img_path, anims = parse_animation_file(txt_path, gender)
        if not img_path or not os.path.exists(img_path):
            print(f"  WARNING: Image not found for {layer_name}, skipping")
            continue

        if anim_name not in anims:
            print(f"  WARNING: Animation '{anim_name}' not found in {layer_name}, skipping")
            continue

        src_img = Image.open(img_path).convert('RGBA')
        layers.append((layer_name, src_img, anims[anim_name]))

    if not layers:
        print(f"  ERROR: No valid layers found!")
        return False

    # Determine frame count from first layer
    num_frames = layers[0][2]['frames_count']
    num_dirs = 8

    # Create output canvas
    sheet_w = num_frames * CELL_SIZE
    sheet_h = num_dirs * CELL_SIZE
    canvas = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))

    # Render each cell
    for game_dir in range(num_dirs):
        flare_dir = GAME_TO_FLARE_DIR[game_dir]
        for frame_idx in range(num_frames):
            cell_x = frame_idx * CELL_SIZE
            cell_y = game_dir * CELL_SIZE

            # Composite all layers (bottom to top)
            for layer_name, src_img, anim_data in layers:
                key = (frame_idx, flare_dir)
                if key in anim_data['frames']:
                    render_frame(canvas, src_img, anim_data['frames'][key], cell_x, cell_y)

    canvas.save(output_path)
    print(f"  Saved: {output_path} ({sheet_w}x{sheet_h})")
    return True


# Class configurations: layers are rendered bottom-to-top
CLASS_CONFIGS = {
    'warrior': {
        'layers': [
            'default_feet', 'default_legs', 'default_chest', 'default_hands',
            'chain_cuirass', 'chain_greaves', 'chain_gloves',
            'head_short', 'longsword', 'shield'
        ],
        'anims': ['run', 'stance', 'swing']
    },
    'mage': {
        'layers': [
            'default_feet', 'default_legs', 'default_chest', 'default_hands',
            'mage_vest', 'mage_boots', 'mage_hood',
            'head_short', 'staff'
        ],
        'anims': ['run', 'stance', 'cast']
    },
    'rogue': {
        'layers': [
            'default_feet', 'default_legs', 'default_chest', 'default_hands',
            'leather_chest', 'leather_pants', 'leather_boots', 'leather_gloves',
            'leather_hood', 'head_short', 'shortbow'
        ],
        'anims': ['run', 'stance', 'shoot']
    },
    'base': {
        'layers': [
            'default_feet', 'default_legs', 'default_chest', 'default_hands',
            'clothes', 'head_short'
        ],
        'anims': ['run', 'stance', 'swing', 'cast', 'shoot']
    }
}


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    gender = "male"  # Start with male avatar

    for class_name, config in CLASS_CONFIGS.items():
        print(f"\n=== Composing {class_name} ===")
        for anim_name in config['anims']:
            output_name = f"hero_{class_name}_{anim_name}.png"
            output_path = os.path.join(OUTPUT_DIR, output_name)
            print(f"  Animation: {anim_name}")
            compose_spritesheet(
                config['layers'], anim_name, output_path, gender
            )

    print("\n=== Done ===")


if __name__ == '__main__':
    main()
