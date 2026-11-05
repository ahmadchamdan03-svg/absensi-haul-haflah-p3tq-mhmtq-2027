import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def process_all():
    src_path = 'public/images/logo-haul-gold.png'
    if not os.path.exists(src_path):
        print(f"File not found: {src_path}")
        return

    img = Image.open(src_path).convert('RGBA')
    print(f"Original size: {img.size}, mode: {img.mode}")
    
    # Process pixels: Royal Navy & Blue
    pixels = img.load()
    w, h = img.size
    
    # Create blue version
    blue_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    blue_pixels = blue_img.load()
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 0:
                brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
                br = int(15 + brightness * (30 - 15))
                bg = int(44 + brightness * (70 - 44))
                bb = int(89 + brightness * (175 - 89))
                blue_pixels[x, y] = (min(255, br), min(255, bg), min(255, bb), a)
            else:
                blue_pixels[x, y] = (0, 0, 0, 0)
                
    blue_img.save('public/images/logo-haul-blue.png', 'PNG')
    blue_img.save('public/logo-haul-haflah-transparent.png', 'PNG')
    # Also save as logo-haul-gold.png so any existing hardcoded references immediately get the royal blue logo
    blue_img.save('public/images/logo-haul-gold.png', 'PNG')
    print("Saved logo-haul-blue.png and updated logo-haul-gold.png & logo-haul-haflah-transparent.png")
    
    # Create padded square transparent icons for favicons
    def create_square_icon(size_px=512, padding_pct=0.1):
        canvas = Image.new('RGBA', (size_px, size_px), (0, 0, 0, 0))
        target_max_size = int(size_px * (1 - 2 * padding_pct))
        
        bw, bh = blue_img.size
        aspect = bw / bh
        
        if aspect > 1:
            new_w = target_max_size
            new_h = int(target_max_size / aspect)
        else:
            new_h = target_max_size
            new_w = int(target_max_size * aspect)
            
        resized_src = blue_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        offset_x = (size_px - new_w) // 2
        offset_y = (size_px - new_h) // 2
        canvas.paste(resized_src, (offset_x, offset_y), resized_src)
        return canvas

    icon_targets = [
        ('app/icon.png', 512),
        ('app/apple-icon.png', 180),
        ('public/icon.png', 512),
        ('public/icon-192.png', 192),
        ('public/icon-512.png', 512),
        ('public/apple-icon.png', 180),
        ('public/apple-touch-icon.png', 180),
        ('public/favicon-32x32.png', 32),
        ('public/favicon-16x16.png', 16),
    ]

    for rel_path, sz in icon_targets:
        abs_path = os.path.abspath(rel_path)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        sq_icon = create_square_icon(sz, padding_pct=0.08)
        sq_icon.save(abs_path, 'PNG')
        print(f"Saved square icon: {rel_path} ({sz}x{sz})")

    # Favicon .ico
    ico_32 = create_square_icon(32, padding_pct=0.08)
    ico_32.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32)])
    print("Saved public/favicon.ico")

    # Generate Open Graph image (1200 x 630)
    panggung_path = 'public/images/panggung-aula.jpg'
    if os.path.exists(panggung_path):
        panggung_img = Image.open(panggung_path).convert('RGB')
        og_w, og_h = 1200, 630
        
        # Crop & resize panggung to 1200x630
        pw, ph = panggung_img.size
        p_aspect = pw / ph
        og_aspect = og_w / og_h
        
        if p_aspect > og_aspect:
            # Crop width
            new_pw = int(ph * og_aspect)
            left = (pw - new_pw) // 2
            panggung_cropped = panggung_img.crop((left, 0, left + new_pw, ph))
        else:
            # Crop height
            new_ph = int(pw / og_aspect)
            top = (ph - new_ph) // 2
            panggung_cropped = panggung_img.crop((0, top, pw, top + new_ph))
            
        og_base = panggung_cropped.resize((og_w, og_h), Image.Resampling.LANCZOS)
        
        # Add royal blue frosted glass card in center
        overlay = Image.new('RGBA', (og_w, og_h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # Soft dark gradient at bottom
        for row in range(og_h // 2, og_h):
            alpha = int(120 * ((row - og_h // 2) / (og_h // 2)))
            draw.line([(0, row), (og_w, row)], fill=(15, 44, 89, alpha))
            
        # Center glass pill: [left=250, top=140, right=950, bottom=490]
        card_w, card_h = 760, 360
        cx, cy = og_w // 2, og_h // 2
        card_box = [cx - card_w // 2, cy - card_h // 2, cx + card_w // 2, cy + card_h // 2]
        
        draw.rounded_rectangle(card_box, radius=28, fill=(240, 249, 255, 220), outline=(186, 230, 253, 240), width=3)
        
        # Composite base and overlay
        og_composite = Image.alpha_composite(og_base.convert('RGBA'), overlay)
        
        # Paste royal blue logo inside card
        logo_target_w = 420
        bw, bh = blue_img.size
        logo_target_h = int(bh * (logo_target_w / bw))
        resized_logo = blue_img.resize((logo_target_w, logo_target_h), Image.Resampling.LANCZOS)
        
        logo_x = cx - logo_target_w // 2
        logo_y = card_box[1] + 35
        og_composite.paste(resized_logo, (logo_x, logo_y), resized_logo)
        
        # Save as JPG
        og_final = og_composite.convert('RGB')
        og_final.save('public/images/og-haflah-blue.jpg', 'JPEG', quality=95)
        print("Saved public/images/og-haflah-blue.jpg (1200x630)")

if __name__ == '__main__':
    process_all()
