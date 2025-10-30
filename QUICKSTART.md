# QueryVeil - Quick Start Guide

Get up and running with QueryVeil in under 5 minutes.

## What is QueryVeil?

QueryVeil protects your privacy by generating realistic "noise" search queries that make it difficult for search engines to build accurate profiles of your interests. It mimics human behavior so closely that automated systems can't tell the difference between real and noise queries.

## Installation (2 minutes)

### Firefox Installation

1. Download or clone this repository
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select the `manifest.json` file
5. Done! The QueryVeil icon appears in your toolbar

## Configuration (2 minutes)

### Basic Setup

1. **Click the QueryVeil icon** in your toolbar
2. **Click "Start"** - The badge turns green
3. That's it! You're protected.

### Recommended Settings

For most users, the default settings work great:
- ✅ Intensity: Medium (12 queries/hour)
- ✅ Search Engine: Google
- ✅ All topics enabled
- ✅ Result clicks: Disabled (saves bandwidth)

### Advanced Setup (Optional)

Click "Advanced Settings" to customize:

**Privacy Maximalist**
- Intensity: High
- Result clicks: Enabled
- All topics: On

**Battery/Bandwidth Saver**
- Intensity: Low
- Result clicks: Disabled
- Schedule: Active hours only

## How to Use

### Daily Use

**Just let it run!** QueryVeil works silently in the background.

- **Green badge** = Active and protecting you
- **Orange badge** = Paused (click to resume)
- **Red badge** = Inactive (click to start)

### Quick Actions

**From toolbar popup:**
- Start/Stop protection
- Pause temporarily
- Change intensity
- View statistics

**Temporarily disable:**
1. Click QueryVeil icon
2. Click "Pause"
3. Do your clean searching
4. Click "Resume" when done

### Best Practices

✅ **Leave it running** - More effective over time
✅ **Check statistics** - Verify it's working (total queries should increase)
✅ **Adjust intensity** - Based on your comfort level
✅ **Enable schedule** - If you only browse during certain hours

❌ **Don't** turn it on and off constantly
❌ **Don't** disable too many topics (reduces effectiveness)
❌ **Don't** set intensity too high (may trigger rate limits)

## Understanding the UI

### Popup (Click toolbar icon)

```
┌─────────────────────┐
│  🛡️ QueryVeil       │  ← Extension name
│  ● Active           │  ← Status indicator
├─────────────────────┤
│ [Start] [Pause]     │  ← Control buttons
├─────────────────────┤
│ Intensity: Medium ▼ │  ← Quick settings
│ Engine: Google ▼    │
├─────────────────────┤
│ STATISTICS          │
│ Total: 1,247        │  ← Queries generated (all time)
│ Session: 42         │  ← This session only
│ Time: 127m          │  ← Session duration
├─────────────────────┤
│ 🔒 Zero logging     │  ← Privacy guarantee
└─────────────────────┘
```

### Options Page

- **General Settings**: Intensity, search engine, result clicks
- **Schedule**: Limit to specific hours
- **Topics**: Choose categories (news, shopping, tech, etc.)
- **Advanced**: Debug mode for developers

## Verifying It Works

### Quick Check (30 seconds)

1. Click QueryVeil icon
2. Look at "Total Queries" number
3. Wait a few minutes
4. Click icon again
5. Number should have increased

### Detailed Check (5 minutes)

1. Open Advanced Settings
2. Enable "Debug Mode"
3. Press F12 (open console)
4. Look for `[QueryVeil]` messages
5. You should see queries being generated

Example console output:
```
[QueryVeil] Initializing...
[QueryVeil] Next query scheduled in 234s
[QueryVeil] Executing query: "best italian restaurants near me"
[QueryVeil] Next query scheduled in 187s
```

## Privacy Guarantees

✅ **Zero logging** - No queries are saved
✅ **Local only** - All processing on your device
✅ **No telemetry** - No data sent anywhere (except to search engines)
✅ **Open source** - You can audit the code
✅ **No history access** - Never looks at your real searches

## Troubleshooting

### "Extension not generating queries"

**Check:**
- Badge is green (not paused/inactive)
- Schedule settings (might be outside active hours)
- Console for errors (F12)

**Fix:** Try clicking "Stop" then "Start"

### "Statistics not increasing"

**Check:**
- Extension is active
- Wait at least 5 minutes (timing is randomized)
- No errors in console

### "High battery/bandwidth usage"

**Fix:**
- Reduce intensity to Low
- Disable "Result clicks"
- Enable schedule (active hours only)

## Support

- 📖 **Full Documentation**: See [README.md](README.md)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/NOTz00m/queryveil/issues)

## FAQ

**Q: Will this slow down my browser?**
A: No. Uses <1% CPU and <50MB RAM on average.

**Q: Can search engines detect this?**
A: QueryVeil mimics human behavior very closely, making detection computationally expensive. No guarantees, but it's designed to be indistinguishable.

**Q: How much bandwidth does it use?**
A: Low intensity: ~0.5MB/hour, Medium: ~1MB/hour, High: ~2MB/hour (without result clicks)

**Q: Is it really private?**
A: Yes. Zero logging, all local processing, open source code. Verify yourself!

**Q: Does it access my real searches?**
A: No. It never looks at your browsing history or real search queries.

**Q: Can I use it with multiple search engines?**
A: Currently targets one at a time. Set to the one you use most or are most concerned about.

**Q: Will it affect my search experience?**
A: No. Noise queries are completely separate from your real searches.

**Q: How often does it query?**
A: Depends on intensity:
- Low: ~6/hour
- Medium: ~12/hour  
- High: ~20/hour

**Q: Can I see what queries it generates?**
A: Enable debug mode and check the browser console. But remember: queries are never stored!

## Tips for Maximum Privacy

1. **Use High Intensity** - More noise = better obfuscation
2. **Enable All Topics** - Diversity prevents false profiles
3. **Run Continuously** - Consistency is key
4. **Use with VPN** - Adds another layer of protection
5. **Enable Result Clicks** - More realistic (but uses bandwidth)
6. **Don't Disable Topics You're Interested In** - Counterintuitive, but helps blend
7. **Let It Run for Weeks** - Long-term patterns matter

## What's Next?

- ✅ You're protected! Just let it run
- ⚙️ Customize settings if needed
- 📊 Check statistics occasionally
- 🌟 Star the repo if you like it
- 🤝 Contribute improvements

---

**You're all set!** 🛡️

QueryVeil is now protecting your search privacy by making it expensive for trackers to profile you.

*Questions? Check the full [README.md](README.md) or [INSTALL.md](INSTALL.md)*
