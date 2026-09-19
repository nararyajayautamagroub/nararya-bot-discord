import sys
from pathlib import Path
from PIL import Image
from rembg import remove

def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: remove_background.py INPUT OUTPUT")
    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    image = Image.open(source).convert("RGBA")
    output = remove(image)
    output.save(target)

if __name__ == "__main__":
    main()
