"""
Batch render isometric sprites from .blend files.
Outputs 8-direction PNG sprites with transparent backgrounds.
Usage: blender -b <any.blend> -P render_sprites.py
  (This script opens each .blend file itself)
Or run directly: python3 render_sprites.py (calls blender subprocess)
"""
import subprocess
import sys
import os

BLEND_DIR_HERO = os.path.join(os.path.dirname(__file__), "isometric_hero_heroine_blend", "isometric_hero_blender")
BLEND_DIR_HEROINE = os.path.join(os.path.dirname(__file__), "isometric_hero_heroine_blend", "isometric_heroine_blender")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "sprites")
BLENDER = "/opt/homebrew/bin/blender"

# Files that crash on Blender 5.0 (pre-2.50 format incompatibility)
SKIP_FILES = {"dagger.blend", "longsword.blend", "shortbow.blend", "weapons.blend"}

RENDER_SCRIPT = r'''
import bpy
import math
import os
import sys

# Get args passed after --
argv = sys.argv
idx = argv.index("--") if "--" in argv else -1
if idx < 0:
    print("ERROR: Pass blend_path and output_dir after --")
    sys.exit(1)
args = argv[idx+1:]
blend_path = args[0]
output_dir = args[1]
prefix = args[2]  # e.g. "hero_clothes" or "heroine_leather_armor"

# Open the blend file
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
render = scene.render

# === RENDER SETTINGS ===
render.engine = 'BLENDER_EEVEE'
render.film_transparent = True
render.image_settings.file_format = 'PNG'
render.image_settings.color_mode = 'RGBA'
# Keep 512x512 @ 25% = 128x128
render.resolution_x = 512
render.resolution_y = 512
render.resolution_percentage = 25

# === CAMERA: tighten framing ===
cam_obj = bpy.data.objects.get('Camera')
if cam_obj and cam_obj.data:
    cam_obj.data.ortho_scale = 2.8  # Tighter framing (was 4.245)

# === HIDE SHADOW PLANE ===
sp = bpy.data.objects.get('ShadowPlane')
if sp:
    sp.hide_render = True

# === WORLD: reduce background influence ===
world = scene.world
if world and hasattr(world, 'node_tree') and world.node_tree:
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs[1].default_value = 0

# === LIGHTING: replace old lamp with game-style lighting ===
old_lamp = bpy.data.objects.get('Lamp')
if old_lamp:
    bpy.data.objects.remove(old_lamp, do_unlink=True)

# Key light (warm, from upper-right)
sun_data = bpy.data.lights.new(name="KeyLight", type='SUN')
sun_data.energy = 4.0
sun_data.color = (1.0, 0.95, 0.88)
sun_obj = bpy.data.objects.new("KeyLight", sun_data)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(55), math.radians(5), math.radians(35))

# Fill light (cool, from lower-left, softer)
fill_data = bpy.data.lights.new(name="FillLight", type='SUN')
fill_data.energy = 1.5
fill_data.color = (0.75, 0.82, 1.0)
fill_obj = bpy.data.objects.new("FillLight", fill_data)
scene.collection.objects.link(fill_obj)
fill_obj.rotation_euler = (math.radians(30), math.radians(-15), math.radians(210))

# Rim light (accent, from behind)
rim_data = bpy.data.lights.new(name="RimLight", type='SUN')
rim_data.energy = 1.0
rim_data.color = (0.9, 0.9, 1.0)
rim_obj = bpy.data.objects.new("RimLight", rim_data)
scene.collection.objects.link(rim_obj)
rim_obj.rotation_euler = (math.radians(20), math.radians(0), math.radians(180))

# === RENDER 8 DIRECTIONS ===
rp = bpy.data.objects.get('RenderPlatform')
if not rp:
    print("ERROR: No RenderPlatform found!")
    sys.exit(1)

os.makedirs(output_dir, exist_ok=True)

# D2-style direction order: S, SW, W, NW, N, NE, E, SE
directions = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
for i, d in enumerate(directions):
    angle = i * math.pi / 4
    rp.rotation_euler[2] = angle
    bpy.context.view_layer.update()

    outpath = os.path.join(output_dir, f"{prefix}_{d}")
    render.filepath = outpath
    bpy.ops.render.render(write_still=True)
    print(f"  {prefix}_{d}.png")

print(f"Rendered {prefix}: 8 directions OK")
'''

def render_blend_files(blend_dir, gender_prefix, output_dir):
    """Render all .blend files in a directory."""
    blend_files = sorted([f for f in os.listdir(blend_dir) if f.endswith('.blend') and f not in SKIP_FILES])

    # Write the render script to a temp file
    script_path = os.path.join(os.path.dirname(__file__), "_render_single.py")
    with open(script_path, 'w') as f:
        f.write(RENDER_SCRIPT)

    results = {"ok": [], "fail": []}

    for blend_file in blend_files:
        name = blend_file.replace('.blend', '')
        prefix = f"{gender_prefix}_{name}"
        blend_path = os.path.join(blend_dir, blend_file)

        print(f"\n{'='*50}")
        print(f"Rendering: {prefix}")
        print(f"{'='*50}")

        try:
            result = subprocess.run(
                [BLENDER, "-b", "--python", script_path, "--", blend_path, output_dir, prefix],
                capture_output=True, text=True, timeout=60
            )
            if result.returncode == 0:
                results["ok"].append(prefix)
                print(f"  OK: {prefix}")
            else:
                results["fail"].append((prefix, result.stderr[-200:] if result.stderr else "unknown"))
                print(f"  FAIL: {prefix}")
                if result.stderr:
                    print(f"  Error: {result.stderr[-200:]}")
        except subprocess.TimeoutExpired:
            results["fail"].append((prefix, "timeout"))
            print(f"  TIMEOUT: {prefix}")
        except Exception as e:
            results["fail"].append((prefix, str(e)))
            print(f"  ERROR: {prefix}: {e}")

    # Cleanup
    if os.path.exists(script_path):
        os.remove(script_path)

    return results

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("ISOMETRIC SPRITE BATCH RENDERER")
    print("=" * 60)

    # Render hero
    print("\n>>> HERO SPRITES <<<")
    hero_results = render_blend_files(BLEND_DIR_HERO, "hero", OUTPUT_DIR)

    # Render heroine
    print("\n>>> HEROINE SPRITES <<<")
    heroine_results = render_blend_files(BLEND_DIR_HEROINE, "heroine", OUTPUT_DIR)

    # Summary
    print("\n" + "=" * 60)
    print("RENDER SUMMARY")
    print("=" * 60)
    all_ok = hero_results["ok"] + heroine_results["ok"]
    all_fail = hero_results["fail"] + heroine_results["fail"]
    print(f"Success: {len(all_ok)}")
    for name in all_ok:
        print(f"  {name}")
    if all_fail:
        print(f"\nFailed: {len(all_fail)}")
        for name, err in all_fail:
            print(f"  {name}: {err}")

    print(f"\nSkipped (known crashes): {SKIP_FILES}")
    print(f"\nOutput directory: {OUTPUT_DIR}")
    print(f"Total sprites: {len(all_ok) * 8} PNGs")
