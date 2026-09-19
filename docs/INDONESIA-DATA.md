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

Background refresh runs every 15 minutes by default.

Source cache policies:
- News: 15 minutes
- Stock quotes: 10 minutes per symbol
- Fuel: 24 hours
- Electricity: 24 hours
- Food: 24 hours
- Prayer schedule: 24 hours

Data retrieval is best-effort. If a public page changes structure or becomes unavailable, the bot reports the source failure rather than pretending the value is current.
