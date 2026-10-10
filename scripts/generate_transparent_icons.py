import os
from PIL import Image

src_path = r'C:\Users\user\.gemini\antigravity\brain\70844ffa-ee55-4871-a1cb-5f7480b7ba47\.user_uploaded\media_1791645412054_da7a4425.png'

if not os.path.exists(src_path):
    print("Error: Source image not found!")
    exit(1)

src_img = Image.open(src_path).convert('RGBA')
print(f"Source loaded: {src_img.size}, mode: {src_img.mode}")

# Create padded square transparent PNG (e.g. 512x512)
def create_square_icon(size_px=512, padding_pct=0.1):
    canvas = Image.new('RGBA', (size_px, size_px), (0, 0, 0, 0))
    target_max_size = int(size_px * (1 - 2 * padding_pct))
    
    w, h = src_img.size
    aspect = w / h
    
    if aspect > 1:
        new_w = target_max_size
        new_h = int(target_max_size / aspect)
    else:
        new_h = target_max_size
        new_w = int(target_max_size * aspect)
        
    resized_src = src_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    offset_x = (size_px - new_w) // 2
    offset_y = (size_px - new_h) // 2
    
    canvas.paste(resized_src, (offset_x, offset_y), resized_src)
    return canvas

# Targets to overwrite
targets = [
    ('app/icon.png', 512),
    ('app/apple-icon.png', 180),
    ('public/icon.png', 512),
    ('public/icon-192.png', 192),
    ('public/icon-512.png', 512),
    ('public/apple-icon.png', 180),
    ('public/apple-touch-icon.png', 180),
    ('public/favicon-32x32.png', 32),
    ('public/favicon-16x16.png', 16),
    ('public/logo-haul-haflah-transparent.png', 512),
]

for rel_path, sz in targets:
    abs_path = os.path.abspath(rel_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    icon_img = create_square_icon(sz, padding_pct=0.08)
    icon_img.save(abs_path, 'PNG')
    print(f"Saved transparent PNG icon: {rel_path} ({sz}x{sz})")

# Header logo replacement (original ratio, transparent PNG)
header_logo_path = os.path.abspath('public/images/logo-haul-gold.png')
os.makedirs(os.path.dirname(header_logo_path), exist_ok=True)
src_img.save(header_logo_path, 'PNG')
print(f"Saved transparent header logo: public/images/logo-haul-gold.png ({src_img.size[0]}x{src_img.size[1]})")

# Delete old .ico files if present
ico_files = ['app/favicon.ico', 'public/favicon.ico']
for ico in ico_files:
    abs_ico = os.path.abspath(ico)
    if os.path.exists(abs_ico):
        os.remove(abs_ico)
        print(f"Deleted old .ico file: {ico}")

print("Icon processing completed successfully!")
