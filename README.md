# KRS Family Week

Home Assistant Lovelace custom card for a consolidated weekly family calendar and separate meal plan. **Prototype v0.1, read-only.**

## Features

- Monday–Sunday week and navigation to preceding/following weeks
- Multiple Google Calendar entities, including two Luke calendars and family calendars
- Separate meal section for each day
- Colors per calendar and missing-entity diagnostics

## Installation

For a Dashboard installation through HACS, add this repository as a custom repository (category Dashboard), install it, and verify that the JavaScript resource `/hacsfiles/krs-family-week/krs-family-week.js` is loaded as a module. This is a **private** repository: depending on your HACS setup, access through a PAT/custom workaround may be required. This access path has not yet been tested.

Manual alternative: copy `dist/krs-family-week.js` to `/config/www/krs-family-week.js`, add `/local/krs-family-week.js` as a JavaScript module resource, and insert the sample configuration below as a manual Lovelace card.

## Configuration

Copy `examples/dashboard.yaml` into a manual card. Each calendar supports `name`, `color` and either `entity_id` (preferred) or `match` (exact Home Assistant friendly name). If a calendar is not found, use the exact `calendar.*` entity_id in your YAML.

The official Google Calendar integration must already be configured in Home Assistant. For meals, create a calendar named `KRS Essensplan` and share editing permissions as needed.

## Next steps

Direct calendar editing, lighting, radio, kiosk navigation and automatic return to the weekly view.

## Privacy

Do not commit credentials, personal events, Home Assistant backups or access tokens.
