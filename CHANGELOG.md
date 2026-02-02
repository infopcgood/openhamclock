# Changelog

All notable changes to OpenHamClock will be documented in this file.

## [3.10.0] - 2025-02-02

### Added
- **Environment-based configuration** - Station settings now stored in `.env` file
  - `.env` is auto-created from `.env.example` on first run
  - Settings won't be overwritten by git updates
  - Supports: CALLSIGN, LOCATOR, PORT, HOST, UNITS, TIME_FORMAT, THEME, LAYOUT
- **Update script** - Easy updates for local/Pi installations (`./scripts/update.sh`)
  - Backs up config, pulls latest, rebuilds, preserves settings
- **Network access configuration** - Set `HOST=0.0.0.0` to access from other devices
- **Grid locator auto-conversion** - Automatically calculates lat/lon from LOCATOR
- **Setup wizard** - Settings panel auto-opens if CALLSIGN or LOCATOR is missing
- **Retro theme** - 90s Windows style with teal background and silver panels
- **Classic layout** - Original HamClock-style with black background, large colored numbers, rainbow frequency bar

### Changed
- Configuration priority: localStorage > .env > defaults
- Server startup now shows station callsign and network access info
- Settings panel updated with .env setup instructions
- DX Spider connection uses dxspider.co.uk as primary (thanks Keith G6NHU)
- SSID -56 for OpenHamClock connections (HamClock uses -55)

### Fixed
- Header clock "shaking" when digits change - now uses monospace font
- Header layout wrapping on smaller screens - added `whiteSpace: nowrap`
- Reduced log spam with rate-limited error logging (1 per minute per type)
- DX Spider connection errors silenced for common issues (ECONNRESET, ETIMEDOUT)

## [3.9.0] - 2025-01-31

### Added
- DX Filter modal with tabs for Zones, Bands, Modes, Watchlist, Exclude
- Spot retention time configurable (5-30 minutes) in Settings
- Satellite tracking with 40+ amateur radio satellites
- Satellite footprints and orbit path visualization
- Map legend showing all 10 HF bands plus DE/DX/Sun/Moon markers

### Changed
- Enlarged Header, DE, and DX panels with bigger fonts
- Improved callsign label positioning on map

### Fixed
- DX Filter modal crash when opening
- K-Index display showing correct values
- Contest calendar attribution

## [3.8.0] - 2025-01-28

### Added
- Multiple DX cluster source fallbacks
- ITURHFProp hybrid propagation predictions
- Ionosonde real-time corrections

### Changed
- DX cluster cache extended to 90 seconds
- Improved error handling for external APIs

## [3.7.0] - 2025-01-25

### Added
- Modular React architecture with Vite
- 13 extracted components
- 12 custom data-fetching hooks
- 3 utility modules
- Railway deployment support
- Docker support

### Changed
- Complete rewrite from monolithic HTML to modular React
- CSS variables for theming
- Separated concerns for easier contribution

## [3.0.0] - 2025-01-15

### Added
- Initial modular extraction from monolithic codebase
- React + Vite build system
- Express backend for API proxying
- Three themes: Dark, Light, Legacy

---

## Version History

- **3.10.x** - Environment configuration, themes, layouts
- **3.9.x** - DX filtering, satellites, map improvements
- **3.8.x** - Propagation predictions, reliability improvements
- **3.7.x** - Modular React architecture
- **3.0.x** - Initial modular version
- **2.x** - Monolithic HTML version (archived)
- **1.x** - Original HamClock fork
