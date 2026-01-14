# Zen Rest

A minimalist break reminder app that helps you take regular breaks and protect your eyes.

Built with Tauri 2.0 + React + TypeScript.

## Features

- **Pomodoro Timer** - Customizable work/rest intervals
- **Fullscreen Rest Mode** - Forces you to take a break with a calming overlay
- **System Tray** - Runs quietly in the background
- **Global Shortcuts** - Skip or pause anytime
- **Preset Modes** - Pomodoro, Short Focus, Deep Work, Eye Care
- **Cross-platform** - Windows & macOS

## Screenshots

![Work Mode](screenshots/work.png)
![Rest Mode](screenshots/rest.png)

## Installation

Download the latest release from [Releases](https://github.com/yourusername/zen-rest/releases).

- **Windows**: Download `.exe` or `.msi`
- **macOS**: Download `.dmg`

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+Q` | Skip rest (default) |
| `Ctrl+Shift+P` | Pause/Resume (default) |

Shortcuts can be customized in Settings.

## Configuration

All settings are stored locally and include:

- Work duration (1-120 minutes)
- Rest duration (5-600 seconds)
- Number of cycles (0 = infinite)
- Auto-start next cycle
- Custom keyboard shortcuts

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Tauri 2.0, Rust
- **Build**: Vite

## License

MIT
