# Architecture

The command layer defines Discord interfaces. Business logic belongs in services, persistence access belongs in the appropriate data layer, and notification delivery follows a source-to-dispatcher pipeline.

Tujuannya agar penambahan fitur tidak membuat src/index.js menjadi monster 20.000 baris yang kemudian menatap kita dengan kebencian.


## Media Subsystem

Media processing is isolated under `src/media` and uses its own SQLite database:

```text
data/media/media.db
```

The subsystem is responsible for:

- URL and attachment acquisition
- downloader execution
- audio source separation
- background removal
- watermark processing
- job metadata and output tracking

General bot persistence remains in the primary application database, while JKT48 game persistence remains in its dedicated game databases.
