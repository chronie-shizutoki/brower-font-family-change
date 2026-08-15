# Font Replacer - Chrome Extension

A Chrome browser extension that replaces specified Chinese fonts (Microsoft YaHei, DengXian, MiSans, PingFang, etc.) with `system-ui` on web pages.

## Features

- Targeted replacement: only replaces elements using specified fonts (微软雅黑/等线/小米字体/苹果字体 etc.), leaving other fonts untouched
- Icon protection: automatically preserves Font Awesome, Material Icons, Google Symbols, and other icon fonts
- Real-time monitoring: watches DOM changes and applies replacement to dynamically loaded content
- Multi-language support: UI available in Simplified Chinese, Traditional Chinese, English, Japanese, and Korean
- Enable/disable toggle via extension popup
- Dark mode support in popup UI

## Installation

### Developer Mode (Recommended)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the extension folder
5. The extension will appear in your extensions list

### Packaged File

1. On the Chrome extensions page, click "Pack extension"
2. Select the extension folder to generate a `.crx` file
3. Drag the `.crx` file onto the Chrome extensions page

## Usage

1. After installation, an icon appears in the browser toolbar
2. Visit any web page — elements using targeted Chinese fonts will be automatically replaced with `system-ui`
3. Click the extension icon to toggle font replacement on/off
4. Use the language selector to switch the popup UI language

## How It Works

1. Scans all DOM elements and checks their computed `font-family`
2. If an element's font matches any target font (e.g., Microsoft YaHei, SimSun, etc.), it's marked with a `data-force-font` attribute
3. A CSS rule `[data-force-font] { font-family: system-ui, sans-serif !important; }` handles the actual replacement
4. A `MutationObserver` watches for new elements and applies the same logic
5. Icon elements are automatically skipped to preserve their icon fonts

### Target Fonts

The following fonts are replaced with `system-ui`:

- **Microsoft YaHei** / 微软雅黑
- **DengXian** / 等线
- **MiSans** / 小米字体
- **PingFang SC/TC/HK** / 苹方 / 苹果字体
- **SimSun** / 宋体
- **SimHei** / 黑体
- **KaiTi** / 楷体
- **FangSong** / 仿宋
- **NSimSun** / 新宋体
- **Microsoft JhengHei** / 微軟正黑體
- **PMingLiU** / 新細明體
- **MingLiU** / 細明體
- **DFKai-SB** / 標楷體

To add or remove target fonts, edit the `targetFonts` array in `content.js`.

## File Structure

```
├── _locales/                 # Localization files
│   ├── en/messages.json      # English
│   ├── zh_CN/messages.json   # Simplified Chinese
│   ├── zh_TW/messages.json   # Traditional Chinese
│   ├── ja/messages.json      # Japanese
│   └── ko/messages.json      # Korean
├── manifest.json             # Extension configuration
├── content.css               # CSS rules (icon protection, targeted replacement)
├── content.js                # Content script (main logic)
├── popup.html                # Popup UI
├── popup.js                  # Popup logic
├── preview.html              # UI preview page
├── preview.js                # Preview mode chrome API mock
├── test-content-font.html    # Targeted replacement test page
├── test-font-switch.html     # Font loading test page
├── test-font-switch.js       # Font loading test script
└── README.md
```

## Technical Implementation

- Manifest V3
- Content scripts inject CSS and JavaScript
- `MutationObserver` monitors DOM changes
- `getComputedStyle` checks element font-family
- `data-force-font` attribute marks elements for replacement
- Chrome Storage API for settings persistence
- CSS `@layer` support for priority management

## Compatibility

- Chrome 88+
- Chromium-based browsers (Edge, Opera, Brave, etc.)

## License

This project is for learning and personal use only.