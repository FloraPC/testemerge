from PIL import Image, ImageDraw

def rounded_gradient_bg(size, radius_ratio=0.22):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    top = (255, 111, 165)   # #FF6FA5
    bottom = (122, 23, 52)  # #7A1734
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = grad.load()
    for y in range(size):
        t = y / (size - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(size):
            gd[x, y] = (r, g, b, 255)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=255)
    img.paste(grad, (0, 0), mask)
    return img

def draw_cell_glyph(img, size, scale=1.0):
    """Ícone original: uma única célula estilizada (círculo + núcleo
    deslocado + corpúsculo polar), coerente com o tema científico do
    jogo (folículo/ovócito) e sem qualquer semelhança com personagens
    ou marcas existentes."""
    d = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2

    r_cell = size * 0.30 * scale
    # leve sombra/contorno para separar do fundo
    d.ellipse([cx - r_cell - 2, cy - r_cell - 2, cx + r_cell + 2, cy + r_cell + 2],
              fill=(255, 255, 255, 60))
    d.ellipse([cx - r_cell, cy - r_cell, cx + r_cell, cy + r_cell], fill=(255, 255, 255, 255))

    # núcleo (deslocado para dar sensação orgânica/assimétrica)
    r_nuc = r_cell * 0.42
    nx, ny = cx + r_cell * 0.22, cy - r_cell * 0.12
    d.ellipse([nx - r_nuc, ny - r_nuc, nx + r_nuc, ny + r_nuc], fill=(224, 36, 94, 235))

    # corpúsculo polar — pequeno detalhe científico
    r_pb = r_cell * 0.14
    px, py = cx - r_cell * 0.72, cy - r_cell * 0.62
    d.ellipse([px - r_pb, py - r_pb, px + r_pb, py + r_pb], fill=(122, 23, 52, 220))

def make_icon(path, size, maskable=False):
    img = rounded_gradient_bg(size, radius_ratio=0.0 if maskable else 0.22)
    draw_cell_glyph(img, size, scale=0.78 if maskable else 1.0)
    img.save(path)

make_icon("icons/icon-192.png", 192)
make_icon("icons/icon-512.png", 512)
make_icon("icons/icon-maskable-512.png", 512, maskable=True)
make_icon("icons/apple-touch-icon.png", 180)
print("icons generated")
