import sys
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: remove_background_video.py INPUT_DIR OUTPUT_DIR")
    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    target.mkdir(parents=True, exist_ok=True)
    session = new_session()
    for frame in sorted(source.glob("*.png")):
        image = Image.open(frame).convert("RGBA")
        output = remove(image, session=session)
        output.save(target / frame.name)

if __name__ == "__main__":
    main()
