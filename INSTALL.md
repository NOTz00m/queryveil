# QueryVeil Installation Guide

Complete guide to installing and configuring QueryVeil for maximum privacy protection.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [First-Time Setup](#first-time-setup)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required
- **Firefox** version 109.0 or higher
  - Firefox Developer Edition (recommended for development)
  - Firefox Release (for regular use)
  - Firefox ESR (Extended Support Release) also supported

### Recommended
- Basic understanding of browser extensions
- 5 minutes for installation and configuration

## Installation Methods

### Method 1: Temporary Installation (Development/Testing)

Best for: Testing, development, or evaluating the extension

1. **Download the Extension**
   ```bash
   git clone https://github.com/NOTz00m/queryveil.git
   # Or download ZIP and extract
   ```

2. **Open Firefox Debug Page**
   - Open Firefox
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Or: Menu → More Tools → Browser Tools → about:debugging

3. **Load Extension**
   - Click "Load Temporary Add-on..."
   - Navigate to the QueryVeil folder
   - Select the `manifest.json` file
   - Click "Open"

4. **Verify Installation**
   - Extension icon should appear in toolbar
   - Badge should show "OFF" (inactive state)

**Note**: Temporary extensions are removed when Firefox restarts. Reload each session for testing.

### Method 2: Permanent Installation (Signed Extension)

Best for: Regular use, maximum security

**⚠️ Currently Not Available**: This extension is not yet signed by Mozilla. To install permanently:

1. **Wait for Mozilla Add-ons Review** (Future)
   - Visit [Firefox Add-ons](https://addons.mozilla.org)
   - Search for "QueryVeil"
   - Click "Add to Firefox"

2. **Or Self-Sign for Personal Use**
   ```bash
   # Install web-ext
   npm install -g web-ext
   
   # Build and sign (requires Mozilla API keys)
   cd queryveil
   web-ext sign --api-key=YOUR_API_KEY --api-secret=YOUR_API_SECRET
   
   # Install the generated .xpi file
   ```

### Method 3: Developer Mode (Unsigned)

For advanced users who understand the security implications:

1. **Open Firefox Config**
   - Navigate to `about:config`
   - Accept the warning

2. **Disable Signature Requirement**
   - Search for `xpinstall.signatures.required`
   - Set to `false`
   - ⚠️ **Security Warning**: Only do this on a dedicated development profile

3. **Install as in Method 1**

## First-Time Setup

### Step 1: Initial Configuration

When you first install QueryVeil, it opens the options page automatically.

1. **Review Privacy Guarantee**
   - Read the privacy notice
   - Understand what data is (and isn't) collected

2. **Choose Intensity Level**
   - **Low** (6/hour): Minimal impact, basic protection
   - **Medium** (12/hour): Recommended balance ✅
   - **High** (20/hour): Maximum obfuscation, higher bandwidth

3. **Select Search Engine**
   - Google (most common, default)
   - Bing (alternative)
   - DuckDuckGo (privacy-focused)

4. **Configure Topics**
   - Enable topics you want in noise queries
   - Disable topics you're genuinely interested in (optional)
   - Recommendation: Keep all enabled for best diversity

### Step 2: Activate Extension

1. **Click Extension Icon** in toolbar
2. **Click "Start"** button
3. **Verify Status**
   - Badge turns green
   - Status shows "Active"

## Configuration

### Basic Settings (Popup)

Quick access from toolbar icon:

- **Start/Stop**: Main power toggle
- **Pause**: Temporary pause (maintains schedule)
- **Intensity**: Quick adjustment
- **Search Engine**: Switch target

### Advanced Settings (Options Page)

Full configuration in dedicated page:

#### General Settings
- **Noise Intensity**: Query frequency
- **Target Search Engine**: Where queries go
- **Simulate Result Clicks**: More realistic but uses bandwidth

#### Schedule
- **Enable Schedule**: Limit to specific hours
- **Active Hours**: When to generate queries
- Example: 9 AM to 11 PM for work hours only

#### Topic Categories
Select which types of queries to generate:
- 📰 News & Current Events
- 🛍️ Shopping & Products
- 🎬 Entertainment
- 💻 Technology
- 🏥 Health & Wellness
- ✈️ Travel
- 🍕 Food & Dining
- 📚 Education
- 📍 Local Places
- 🔍 General Knowledge

**Strategy**: 
- Disable topics you actively research (to avoid false positives)
- Keep diverse selection for better obfuscation
- Enable at least 5-6 categories

#### Advanced Options
- **Debug Mode**: Console logging for development
- **Result Click Simulation**: Fetch result pages (bandwidth intensive)

### Recommended Configurations

#### Privacy Maximalist
```
Intensity: High
Search Engine: Google (most tracked, needs most noise)
Result Clicks: Enabled
Schedule: All day (0-24)
Topics: All enabled
```

#### Balanced User
```
Intensity: Medium
Search Engine: Google
Result Clicks: Disabled
Schedule: Waking hours (8-23)
Topics: 7-8 categories enabled
```

#### Minimal Impact
```
Intensity: Low
Search Engine: DuckDuckGo
Result Clicks: Disabled
Schedule: Work hours only (9-17)
Topics: 4-5 categories enabled
```

## Verification

### Check Extension is Working

1. **Badge Indicator**
   - Green "ON" = Active
   - Orange "||" = Paused
   - Red "OFF" = Inactive

2. **Statistics**
   - Open popup
   - Check "Total Queries" increases over time
   - "This Session" shows current session count

3. **Network Activity**
   - Open DevTools Network tab
   - Filter for your search engine
   - Should see periodic requests

4. **Query Quality**
   - Enable debug mode
   - Review logged queries
   - Verify they look human-like and diverse

### Privacy Verification

1. **No External Calls**
   - Network tab should only show search engine requests
   - No analytics, telemetry, or API calls

2. **Local Storage Only**
   - DevTools → Storage → Extension Storage
   - Should only see: settings, statistics (counts only)
   - No query history or sensitive data

3. **Memory Safety**
   - about:performance
   - QueryVeil should use < 50MB RAM
   - No memory leaks over time

## Troubleshooting

### Extension Not Loading

**Symptom**: Icon doesn't appear, or error on load

**Solutions**:
1. Check Firefox version (need 109+)
2. Verify manifest.json exists and is valid
3. Check browser console for errors
4. Try reloading: about:debugging → Reload

### No Queries Generating

**Symptom**: Statistics don't increase, no console logs

**Solutions**:
1. Verify extension is active (green badge)
2. Check if paused (orange badge)
3. Review schedule settings (might be outside active hours)
4. Check console for errors
5. Try "Generate Now" via manual trigger (dev mode)

### Queries Look Unnatural

**Symptom**: Gibberish or obvious bot patterns

**Solutions**:
1. Verify you're running latest version
2. Check if enough topics are enabled
3. Review topic category settings
4. Report issue with examples on GitHub

### High Resource Usage

**Symptom**: Browser slow, high CPU/RAM

**Solutions**:
1. Reduce intensity to Low
2. Disable result click simulation
3. Check for errors causing retry loops
4. Reload extension to clear any memory leaks
5. Report if persists

### Settings Not Persisting

**Symptom**: Configuration resets after restart

**Solutions**:
1. Check storage permissions
2. Verify Firefox profile isn't read-only
3. Try clearing extension storage and reconfigure
4. Check for Firefox profile corruption

### Rate Limited by Search Engine

**Symptom**: Many failed requests, automatic pause

**Solutions**:
1. Extension will auto-pause and retry later
2. Reduce intensity
3. Try different search engine
4. Wait for exponential backoff to reset (1 hour)

## Support

### Getting Help

1. **Check Documentation**
   - README.md
   - ARCHITECTURE.md
   - This guide

2. **Search Issues**
   - [GitHub Issues](https://github.com/NOTz00m/queryveil/issues)
   - Someone may have had same problem

3. **Ask Community**
   - [GitHub Discussions](https://github.com/NOTz00m/queryveil/discussions)
   - Community support

4. **Report Bug**
   - Use bug report template
   - Include version, OS, steps to reproduce

## Next Steps

After successful installation:

1. ✅ Let it run for a day
2. ✅ Check statistics to verify operation
3. ✅ Adjust settings based on your needs
4. ✅ Review generated queries (debug mode)
5. ✅ Join community discussions
6. ✅ Consider contributing!

## Uninstallation

To remove QueryVeil:

1. **Via about:addons**
   - Navigate to `about:addons`
   - Find QueryVeil
   - Click "Remove"
   - Confirm deletion

2. **Via about:debugging** (temporary install)
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Find QueryVeil
   - Click "Remove"

3. **Data Cleanup**
   - All data removed automatically
   - No leftover tracking or storage
   - Clean uninstall guaranteed

---

**Installation complete!** 🛡️ Your searches are now more private.

*Questions? See [README.md](README.md) or open an issue.*
