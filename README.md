# Shufersal Attendance Hours Sync

Scrape attendance data from supported source systems and sync it into a supported target timesheet system.

The project currently supports:

- Scraping from `hilan` and `synerion`
- Automating entry into `webtime`
- Running as a CLI-style script, an HTTP API, or through the local frontend

## Features

- Extensible scraper and automator architecture
- Support for regular workdays and vacation days
- API server for programmatic usage
- Local React frontend for those that prefer GUIs
- Shared environment schema for CLI and API execution

## Requirements

- Node.js `22` or newer
- npm
- Access to the source and target systems you plan to use

## Installation

```bash
git clone https://github.com/RonStShufersal/get_attendance_hours
cd get_attendance_hours
npm install
```

To use the frontend as well:

```bash
npm run ui:quickstart
```

## Configuration

Create a `.env` file in the project root.

```env
SCRAPING_TARGET=hilan
AUTOMATION_TARGET=webtime

SCRAPER_USERNAME=your_source_username
SCRAPER_PASSWORD=your_source_password
AUTOMATOR_USERNAME=your_target_username
AUTOMATOR_PASSWORD=your_target_password

PORT=3000
THROW_ON_MALFORMED_DAYS=false
```

### Environment variables

| Variable                  | Required | Default       | Description                                                  |
| ------------------------- | -------- | ------------- | ------------------------------------------------------------ |
| `SCRAPING_TARGET`         | Yes      | `hilan`       | Source system to scrape from                                 |
| `AUTOMATION_TARGET`       | Yes      | `webtime`     | Target system to fill                                        |
| `SCRAPER_USERNAME`        | Yes      | -             | Username for the selected scraping source                    |
| `SCRAPER_PASSWORD`        | Yes      | -             | Password for the selected scraping source                    |
| `AUTOMATOR_USERNAME`      | Yes      | -             | Username for the selected automation target                  |
| `AUTOMATOR_PASSWORD`      | Yes      | -             | Password for the selected automation target                  |
| `PORT`                    | No       | `3000`        | Port used by the Express API server                          |
| `THROW_ON_MALFORMED_DAYS` | No       | false (unset) | When `true`, fail instead of skipping malformed scraped rows |

## Compatibility

### Supported targets

| Type      | Target     | Status     | Notes                                              |
| --------- | ---------- | ---------- | -------------------------------------------------- |
| Scraper   | `hilan`    | Supported  | Main browser-based scraper                         |
| Scraper   | `synerion` | Deprecated | Available as a scraping source, but not maintained |
| Automator | `webtime`  | Supported  | Current automation target                          |

### Supported source to target combinations

| Scraper    | Automator | Status     |
| ---------- | --------- | ---------- |
| `hilan`    | `webtime` | Supported  |
| `synerion` | `webtime` | Deprecated |

### Day modifier compatibility

| Capability    | `hilan` scrape                                                     | `webtime` automation    |
| ------------- | ------------------------------------------------------------------ | ----------------------- |
| Regular days  | Yes                                                                | Yes                     |
| Vacation days | Yes                                                                | Yes                     |
| Sick days     | Available in scrape flow, but not enabled in current orchestration | Not currently supported |
| Split days    | Yes                                                                | Yes                     |

## Usage

### Run the default flow

This runs the currently configured default combination: `hilan -> webtime`.

```bash
npm start
```

### Run a specific supported combination

```bash
npm run start:hilan:webtime
npm run start:synerion:webtime
```

### Start the API server

```bash
npm run build
node dist/index.js
```

Health check:

```http
GET /health
```

Scrape and sync request:

```http
POST /api/scrape
Content-Type: application/json
```

Example body:

```json
{
	"SCRAPING_TARGET": "hilan",
	"AUTOMATION_TARGET": "webtime",
	"SCRAPER_USERNAME": "your-source-user",
	"SCRAPER_PASSWORD": "your-source-password",
	"AUTOMATOR_USERNAME": "your-target-user",
	"AUTOMATOR_PASSWORD": "your-target-password"
}
```

### Run the frontend locally

Start the API server in one terminal:

```bash
node dist/index.js
```

Start the frontend in another:

```bash
npm run ui:dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`.

## Development

Build the backend:

```bash
npm run build
```

Build the frontend:

```bash
npm run ui:build
```

Run tests:

```bash
npm run test:browser
```

Lint the codebase:

```bash
npm run lint
```

## Known limitations

- The current default orchestration enables vacation days, but not sick days.
- `webtime` automation assumes the active timesheet belongs to the current calendar year
- Browser automation depends on Puppeteer and may require environment-specific adjustments in some setups

## Contributing

Contributions are welcome.

- Open an issue for bugs, edge cases, or unsupported target combinations
- Send a PR if you want to improve docs, fix scraping/automation issues, or add new targets
- If you use this project, consider contributing target compatibility notes so the README stays accurate

If you are interested in contributing, especially around additional targets, reliability improvements, or test coverage, please jump in.

## License

MIT
