# Media System

Media processing lives under src/media. Python helpers live under tools/media.

## Operations

- Video download.
- Audio download.
- Image download.
- Vocal separation.
- Instrumental generation.
- Image background removal.
- Video background removal.
- Image watermark removal.
- Video watermark removal.
- Media settings.
- Resolution control.

## Commands

- /media video
- /media audio
- /media image
- /media vocals
- /media instrumental
- /media background
- /media watermark
- /media settings

## External tools

- yt-dlp
- FFmpeg
- Python
- Demucs
- rembg
- Pillow
- OpenCV

## URL support

Video and audio use yt-dlp for broad public platform support.

The exact platform set follows the installed yt-dlp version.

The service does not bypass login requirements, CAPTCHA, paywalls, private accounts, or anti-bot protections.

## Safety controls

- HTTP and HTTPS validation.
- Isolated job directories.
- SQLite job records.
- Download and output size limits.
- Format and resolution validation.
- User-safe error messages.

## Environment

~~~
MEDIA_DATA_DIR=./data/media
MEDIA_MAX_DOWNLOAD_MB=200
MEDIA_MAX_UPLOAD_MB=8
MEDIA_HTTP_TIMEOUT_MS=30000
YTDLP_PATH=yt-dlp
FFMPEG_PATH=ffmpeg
PYTHON_BIN=python
DEMUCS_MODEL=htdemucs
~~~

## Python helpers

Install requirements:

~~~
pip install -r tools/media/requirements.txt
~~~

Background removal:

~~~
python tools/media/remove_background.py input.png output.png
python tools/media/remove_background_video.py frames/ output/
~~~

Watermark removal:

~~~
python tools/media/remove_watermark.py input.png output.png x y width height
~~~
