# LinkJoy Vault

A modern bookmark management application with AI-powered content analysis and platform-specific metadata extraction.

## Features

- 🔖 **Smart Bookmark Management**: Organize and categorize your bookmarks with tags
- 🤖 **AI Content Analysis**: Get insights about your saved content
- 🏷️ **Platform Support**: Automatic metadata extraction for YouTube, Shopee, and more
- 🎨 **Modern UI**: Beautiful, responsive interface with dark/light theme
- 🔐 **User Authentication**: Secure login with Supabase
- 📱 **Mobile Responsive**: Works perfectly on all devices

## Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Auto Push Scripts

For easy deployment to GitHub, use these scripts:

- **`auto-push.bat`** - Full auto-push with detailed output and pause
- **`quick-push.bat`** - Fast auto-push without pause

Just double-click the script file to automatically:
1. Add all changes
2. Commit with timestamp
3. Push to GitHub

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Database)
- **AI**: OpenAI API integration
- **Styling**: Tailwind CSS with custom components

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/            # shadcn/ui components
│   └── ...            # Custom components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── integrations/       # External service integrations
└── lib/               # Utility functions
```

## Contributing

1. Make your changes
2. Run `auto-push.bat` or `quick-push.bat`
3. Your changes are automatically pushed to GitHub!

## License

MIT License
