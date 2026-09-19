# Media Subsystem

## Overview

The media subsystem provides public URL downloads and local media transformations through the `/media` command.

## Commands

- `/media download`
  - Downloads video, audio, or image content from a public URL supported by the configured downloader.
  - Video downloads support configurable resolutions.
  - Audio downloads support MP3, M4A, WAV, and FLAC.
- `/media vocals`
  - Separates vocals from a song and returns the instrumental track.
- `/media background`
  - Removes image backgrounds.
  - Video background removal produces a WebM video with transparency.
- `/media watermark`
  - Removes a specified rectangular watermark region from an image or video.
- `/media settings`
  - Stores per-user default resolution and output formats.

## Download Support

Video and audio URL extraction uses `yt-dlp`. The supported URL set therefore follows the extractors available in the installed yt-dlp version. Direct image URLs and pages exposing a public `og:image` or `twitter:image` are supported before falling back to yt-dlp thumbnail extraction.

The bot does not bypass authentication, DRM, CAPTCHA, paywalls, private resources, or platform access controls.

## Resolution

Supported video resolutions:

- best
- 2160p
- 1440p
- 1080p
- 720p
- 480p
- 360p

The selected resolution is a maximum target. The downloader may return a lower resolution when the source does not provide the requested quality.

## Audio Source Separation

Vocal removal uses Demucs through the configured Python environment. The current implementation uses the `--two-stems=vocals` mode and produces the accompaniment without the vocal stem.

Required Python dependencies are listed in `tools/media/requirements.txt`.

## Background Removal

Image and video background removal uses `rembg`. Video processing is performed frame by frame and can require significant CPU, RAM, GPU memory, disk space, and processing time.

Video background removal is returned as WebM with an alpha channel.

## Watermark Removal

Watermark removal requires a rectangular region:

- `x`
- `y`
- `width`
- `height`

Image watermark removal uses OpenCV inpainting. Video watermark removal extracts frames, applies the same operation to each frame, and reassembles the video while preserving audio when available.

This workflow is intended for content the operator is authorized to edit. The software does not grant rights to remove or redistribute third-party watermarks.

## File Limits and Storage

Environment variables:

- `MEDIA_DATA_DIR`: media database and job directory.
- `MEDIA_MAX_DOWNLOAD_MB`: maximum source download size.
- `MEDIA_MAX_UPLOAD_MB`: maximum result size sent to Discord.
- `MEDIA_HTTP_TIMEOUT_MS`: HTTP request timeout.
- `YTDLP_PATH`: yt-dlp executable.
- `FFMPEG_PATH`: optional FFmpeg executable path.
- `PYTHON_BIN`: Python executable.
- `DEMUCS_MODEL`: Demucs model name.
- `REMBG_SCRIPT`: optional custom image background-removal script.
- `REMBG_VIDEO_SCRIPT`: optional custom video background-removal script.
- `WATERMARK_SCRIPT`: optional custom watermark-removal script.

The subsystem stores job metadata in:

```text
data/media/media.db
```

Temporary processing files are stored under per-job directories and removed after successful Discord delivery.

## Installation

Node dependencies are installed with:

```bash
npm install
```

Install the optional Python media dependencies:

```bash
python -m pip install -r tools/media/requirements.txt
```

Install yt-dlp and FFmpeg separately and make sure their executables are available in the configured paths or system PATH.

## Operational Notes

Media processing can be CPU- and memory-intensive. Operators should configure file limits and restrict the command to trusted users or guilds when necessary.

Heavy operations such as Demucs separation, frame-by-frame background removal, and frame-by-frame watermark removal may take substantially longer than normal Discord command processing. The bot defers the Discord interaction while the job is running.
