#!/usr/bin/env python3
"""
Simple icon generator for SignBridge Chrome Extension
Creates placeholder icons if PIL is not available, uses text otherwise
"""

import os

try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("PIL not found, creating simple placeholder icons...")

def create_simple_icon(size, filename):
    """Create a simple colored square as a placeholder icon"""
    # SignBridge brand color
    color = (29, 111, 94)  # #1d6f5e
    
    if HAS_PIL:
        img = Image.new('RGB', (size, size), color)
        
        # Add white emoji/symbol in center
        draw = ImageDraw.Draw(img)
        
        # Try to add a simple symbol
        try:
            # Use a large font
            font_size = int(size * 0.6)
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            font = ImageFont.load_default()
        
        # Draw handshake emoji or text
        text = "🤝" if size > 16 else "S"
        
        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Center the text
        x = (size - text_width) // 2
        y = (size - text_height) // 2
        
        draw.text((x, y), text, fill='white', font=font)
        
        img.save(filename)
        print(f"[OK] Created {filename} ({size}x{size})")
    else:
        # Fallback: create minimal PNG manually
        # This is a very basic 1x1 green pixel PNG
        png_data = create_minimal_png(size, color)
        with open(filename, 'wb') as f:
            f.write(png_data)
        print(f"[OK] Created placeholder {filename} ({size}x{size})")


def create_minimal_png(size, color):
    """Create a minimal valid PNG file with solid color"""
    import struct
    import zlib
    
    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    ihdr_chunk = create_png_chunk(b'IHDR', ihdr_data)
    
    # IDAT chunk (image data)
    raw_data = b''
    for y in range(size):
        raw_data += b'\x00'  # Filter type: None
        raw_data += bytes(color) * size
    
    compressed_data = zlib.compress(raw_data)
    idat_chunk = create_png_chunk(b'IDAT', compressed_data)
    
    # IEND chunk
    iend_chunk = create_png_chunk(b'IEND', b'')
    
    return png_signature + ihdr_chunk + idat_chunk + iend_chunk

def create_png_chunk(chunk_type, data):
    """Create a PNG chunk with CRC"""
    import struct
    import zlib
    
    length = struct.pack('>I', len(data))
    crc_data = chunk_type + data
    crc = struct.pack('>I', zlib.crc32(crc_data) & 0xffffffff)
    
    return length + chunk_type + data + crc

if __name__ == '__main__':
    os.chdir('icons')
    
    # Create icons in standard sizes
    create_simple_icon(16, 'icon-16.png')
    create_simple_icon(48, 'icon-48.png')
    create_simple_icon(128, 'icon-128.png')
    
    print("\n[OK] All icons created successfully!")
    print("\n💡 Tip: For better icons, use https://favicon.io/emoji-favicons/ with the 🤝 emoji")
