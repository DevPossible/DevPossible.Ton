# DevPossible.Ton Documentation

## Quick Start

### Method 1: PowerShell Script (Recommended)
```powershell
.\launch.ps1
```
This will automatically:
- Start a local web server on port 8080
- Open your default browser to the documentation
- Display the server status in the console

**Options:**
- `.\launch.ps1 -Port 3000` - Use a different port
- `.\launch.ps1 -NoBrowser` - Don't open browser automatically
- `.\launch.ps1 -Browser firefox` - Use a specific browser

### Method 2: Batch File (Windows)
Double-click `launch-docs.bat` or run:
```cmd
launch-docs.bat
```

### Method 3: NPM Scripts
```bash
# Open docs in browser automatically
npm run docs

# Just start the server (no browser)
npm run docs:serve

# Start with live reload (requires live-server)
npm run docs:watch
```

### Method 4: Direct npx Command
```bash
npx http-server doc/doc-html -p 8080 -o
```

## Documentation Structure

The documentation is located in the `doc/doc-html/` folder:
```
doc/
└── doc-html/
    ├── index.html          # Main documentation page
    ├── css/               # Stylesheets
    │   └── styles.css
    ├── js/                # JavaScript files
    │   └── scripts.js
    ├── images/            # Images and logos
    └── *.html            # Additional documentation pages
```

## Features

- **Responsive Design**: Works on desktop and mobile devices
- **Syntax Highlighting**: Code examples with proper formatting
- **Search**: Built-in search functionality
- **Navigation**: Easy navigation between sections
- **Examples**: Interactive code examples
- **API Reference**: Complete API documentation

## Requirements

- Node.js 14.0.0 or higher
- npm or npx available in PATH

## Troubleshooting

### Port Already in Use
The launch script automatically finds an available port if 8080 is busy. You can also specify a different port:
```powershell
.\launch.ps1 -Port 3000
```

### Node.js Not Found
Install Node.js from [https://nodejs.org/](https://nodejs.org/)

### Documentation Not Loading
Ensure the `doc/doc-html` folder exists and contains `index.html`

## Development

To modify the documentation:
1. Edit files in the `doc/doc-html` folder
2. The server will serve updated content (refresh browser to see changes)
3. For live reload, use: `npm run docs:watch`

## Support

For questions or issues, contact:
- Email: support@devpossible.com
- Website: https://devpossible.com

---
© 2024 DevPossible, LLC. All rights reserved.