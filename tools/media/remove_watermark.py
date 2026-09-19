import sys
from pathlib import Path
import cv2

def main():
    if len(sys.argv) != 7:
        raise SystemExit("Usage: remove_watermark.py INPUT OUTPUT X Y WIDTH HEIGHT")
    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    x, y, width, height = map(int, sys.argv[3:7])
    image = cv2.imread(str(source), cv2.IMREAD_COLOR)
    if image is None:
        raise SystemExit("Unable to read input image")
    h, w = image.shape[:2]
    x=max(0,min(x,w-1))
    y=max(0,min(y,h-1))
    width=max(1,min(width,w-x))
    height=max(1,min(height,h-y))
    mask = image.copy()
    mask[:] = 0
    mask[y:y+height,x:x+width] = 255
    gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
    restored = cv2.inpaint(image, gray, 3, cv2.INPAINT_TELEA)
    cv2.imwrite(str(target), restored)

if __name__ == "__main__":
    main()
