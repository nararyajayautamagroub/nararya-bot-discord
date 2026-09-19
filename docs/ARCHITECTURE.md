# Architecture

The command layer defines Discord interfaces. Business logic belongs in services, persistence access belongs in the appropriate data layer, and notification delivery follows a source-to-dispatcher pipeline.

Tujuannya agar penambahan fitur tidak membuat src/index.js menjadi monster 20.000 baris yang kemudian menatap kita dengan kebencian.
