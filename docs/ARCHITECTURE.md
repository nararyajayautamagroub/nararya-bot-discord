# Architecture

Command layer hanya bertugas mendefinisikan interface Discord. Business logic berada di services. Database access berada di repositories. Notification pipeline memakai source -> scraper -> normalizer -> dedupe -> dispatcher -> channel.

Tujuannya agar penambahan fitur tidak membuat src/index.js menjadi monster 20.000 baris yang kemudian menatap kita dengan kebencian.
