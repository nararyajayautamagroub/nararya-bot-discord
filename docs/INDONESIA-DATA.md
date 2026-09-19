# Indonesia Data

## News

`/news latest` reads public RSS feeds from ANTARA. Categories are:
- latest
- top
- economy
- finance
- business
- market
- politics
- law

News cache: 15 minutes.

## Stocks

`/market stock symbol:<ticker>` accepts Indonesian tickers such as `BBCA`, `TLKM`, or `BBCA.JK`.

`/market ihsg` uses the Yahoo Finance index symbol for IHSG.

Quotes are informational and can be delayed. The Indonesia Stock Exchange feed used by Yahoo Finance is listed with the `.JK` suffix and a 10-minute delay.

## Fuel

`/prices fuel` returns an acuan list of Pertamina fuel prices. Fuel prices can differ by region, product, and official changes.

Cache: 24 hours.

## Electricity

`/prices electricity` returns a selected tariff summary by customer class.

Tariffs depend on customer class, subsidy status, and official tariff changes.

Cache: 24 hours.

The bot checks the configured PLN source during refresh. Because public page layouts can change, the displayed tariff table uses the configured application baseline rather than assuming that arbitrary page text is machine-readable.

## Food

`/prices food` returns strategic food commodities where source parsing is available.

The project uses the Bank Indonesia PIHPS page as a public source. PIHPS exposes commodities such as rice, shallots, garlic, chilies, chicken, beef, sugar, cooking oil, and eggs.

Cache: 24 hours.

## Ramadan

Commands:
- `/ramadan upcoming`
- `/ramadan today city:<city>`
- `/ramadan setup city:<city> channel:<channel>`
- `/ramadan disable`
- `/ramadan test`

The bot uses the configured timezone, default `Asia/Jakarta`.

Sahur notification:
- sent 30 minutes before Imsak.

Iftar notification:
- sent at Maghrib.

Date overrides:
- `RAMADAN_START_OVERRIDE`
- `RAMADAN_END_OVERRIDE`

Use these overrides when the official Indonesian date is published and differs from the current estimate.

## Data Refresh

Background full refresh runs every 24 hours by default. Slash-command requests may refresh a source earlier when its short cache expires. URL health is checked separately every 10 seconds.

Source cache policies:
- News command cache: 15 minutes
- News background full refresh: 24 hours
- Stock quotes: 10 minutes per symbol
- Fuel: 24 hours
- Electricity: 24 hours
- Food: 24 hours
- Prayer schedule: 24 hours

Data retrieval is best-effort. If a public page changes structure or becomes unavailable, the bot reports the source failure rather than pretending the value is current.


## Electronics

`/electronics` uses the public Bandingin.id electronics and audio catalog pages as an HTML scraper source. The command supports category and keyword filtering and returns product title, price, marketplace when detectable, and product URL.

The source is registered for a 30-minute refresh interval. URL health remains part of the 10-second integrity checks.
