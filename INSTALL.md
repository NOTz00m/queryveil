# QueryVeil Installation Guide

Quick setup guide for QueryVeil.

## Requirements

- Firefox 109.0 or higher
- 5 minutes

## Installation

### Option 1: Firefox Add-ons Store (Easiest)

Get it directly from the official store:

**[Install QueryVeil from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/queryveil/)**

Click "Add to Firefox" and you're done. The extension will automatically update when new versions are released.

### Option 2: Manual/Development Install

For testing or development:

1. Clone or download this repository
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file from the extension folder

Note: Temporary add-ons are removed when Firefox restarts. Use the Firefox store version for permanent installation.

## First-Time Setup

After installing:

1. Click the QueryVeil icon in your Firefox toolbar
2. The options page opens automatically
3. Choose your settings:
   - **Intensity**: Start with Medium (12 queries/hour)
   - **Search Engine**: Pick the one you use most (Google, Bing, or DuckDuckGo)
   - **Topics**: Leave all enabled for best diversity
4. Click "Start" in the toolbar popup
5. Badge turns green - you're protected!

## Configuration Tips

Click "Advanced Settings" from the popup to customize:

**Intensity levels:**
- Low (6/hour) - Light usage, minimal bandwidth
- Medium (12/hour) - Recommended for most users
- High (20/hour) - Maximum privacy, more bandwidth
- Custom (1-30/hour) - Set your own rate

**Topics:**
- Enable 5-6 diverse categories for best results
- More diversity = harder to profile

**Schedule:**
- Optionally limit to certain hours (e.g., 9 AM - 11 PM)
- Useful if you only browse during specific times

**Result Clicks:**
- Off = Uses less bandwidth (default)
- On = More realistic but uses more data

## Verify It's Working

1. **Check the badge:**
   - Green "ON" = Active and working
   - Orange "||" = Paused
   - Red "OFF" = Inactive

2. **Watch the statistics:**
   - Click the QueryVeil icon
   - "Total Queries" should increase over time
   - Wait 5-10 minutes and check again

3. **Optional - Developer check:**
   - Enable Debug Mode in Advanced Settings
   - Press F12 to open console
   - Look for `[QueryVeil]` messages showing generated queries

## Troubleshooting

**Extension not working:**
- Make sure badge is green (click Start if not)
- Check if outside scheduled hours
- Try stopping and starting again

**Settings reset after Firefox restart:**
- If using temporary add-on, this is normal
- Install from Firefox Add-ons store for persistence

**High bandwidth/CPU usage:**
- Lower intensity to Low
- Disable result click simulation
- Use schedule to limit active hours

**Queries not increasing:**
- Wait 5-10 minutes (timing is randomized)
- Check console (F12) for errors
- Verify you're within scheduled hours if enabled

## Need Help?

- Check the [README](README.md) for more details
- Report bugs on [GitHub Issues](https://github.com/NOTz00m/queryveil/issues)
- Review your query on [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/queryveil/)

## Uninstall

To remove QueryVeil:
1. Go to `about:addons` in Firefox
2. Find QueryVeil
3. Click "Remove"

All extension data is automatically deleted. No traces left behind.

---

**That's it!** 🛡️ Your searches are now more private.
