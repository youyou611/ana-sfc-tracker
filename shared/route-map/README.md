# Shared World Route Map

The shared implementation lives in this folder and uses `../world-airports.json` as its sole airport-coordinate source. Each independent Next.js app imports `WorldRouteMap.tsx` and `WorldRouteMap.css` from this folder and maps its existing records into `RouteMapFlight` at the call site.

The SVG map uses Natural Earth 1:110m land geometry, converted by `scripts/build-route-map-geography.mjs` into `natural-earth-land-paths.json`, and spherical great-circle routes. Route samples are split at the antimeridian. Displayed kilometers are approximate geographic great-circle distances only; never use them in ANA PP, ANA official sector mileage, JAL FOP/LSP, or JAL official sector mileage calculations.

The inline map is a non-interactive preview. Tapping/clicking it opens a dedicated full-screen map experience; pan, zoom, display modes and map controls live only in that experience. The 2D world repeats horizontally across the antimeridian so left/right scrolling does not encounter an empty map edge. The 3D mode is a slowly auto-rotating spherical globe that can be turned by dragging, with a control to pause/resume rotation. It projects the bundled Natural Earth land geometry, saved airport positions, and great-circle routes onto a sphere; it is not a satellite/terrain globe or Google Earth integration and needs no external tile service or API key. The JAL app enables a separate `JAL` / `ワンワールド` filter from the existing `flightType` field; older records without that field are grouped under JAL. That filter affects only map display and does not mutate or delete saved records.

Domestic calculator records are stored as IATA airport codes for new entries. The shared map also resolves legacy Japanese display labels such as `東京(羽田)` and `大阪(伊丹)` to known IATA codes, so older domestic entries can be plotted without rewriting saved logs. The fullscreen 2D map repeats world copies at exactly one map-width intervals and wraps horizontal pan to avoid exposing blank edges. Globe surface fills are opaque; drag rotates it, and wheel/controls zoom it.

Airport coordinates have one canonical source: `shared/world-airports.json`, derived from OurAirports' public-domain data. The JAL `/data/airports.json` compatibility file is generated from that source with `scripts/sync-airport-data.mjs`; do not edit it manually. The old ANA component-level airport JSON is unused and should not be reintroduced.

## Independent app builds

The three apps remain separately installable and separately deployable. Their `next.config.ts` declares the parent repository as `outputFileTracingRoot`; imports from `../shared/route-map` are compiled into each app. The deployment/build context must include the repository root and the selected app folder, and build commands run from that app folder. A deployment platform configured with the app folder as its sole uploaded root must be changed to include the repository root, or the shared imports cannot resolve.

All three apps resolve React/Next dependencies from their own `node_modules`. The shared map intentionally imports only React and bundled JSON; it does not require a new package, tile service, API key, or runtime map request. From the repository root, run `node scripts/build-route-map-geography.mjs`, `node scripts/sync-airport-data.mjs`, and `node scripts/verify-route-map-data.mjs` after updating source data.

## Updating the JAL compatibility data

From the repository root run `node scripts/sync-airport-data.mjs`. The script validates the normalized canonical file before writing `JAL赤組用アプリ/public/data/airports.json`. Do not edit generated rows directly.

## Attribution

Airport coordinates: OurAirports, public-domain airport data, https://ourairports.com/data/ . Land geometry: Natural Earth 1:110m, public domain, https://www.naturalearthdata.com/downloads/110m-physical-vectors/110m-land/ . Suggested attribution: “Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.” The map is a geographic visualization, not an aviation navigation chart.
