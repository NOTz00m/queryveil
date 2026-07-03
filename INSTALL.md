# Installation & Setup Guide

## Quick Install (Recommended)

1. Go to the [QueryVeil Firefox Add-ons page](https://addons.mozilla.org/en-US/firefox/addon/queryveil/)
2. Click **Add to Firefox**
3. Click **Add** in the permission popup
4. Pin the extension to your toolbar for easy access

## Manual Install (From Source)

If you want to run the latest development version or audit the code yourself:

1. Clone or download this repository
   ```bash
   git clone https://github.com/NOTz00m/queryveil.git
   ```
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on...**
4. Select the `manifest.json` file from the downloaded folder
5. The extension is now active! *(Note: Temporary add-ons disappear when Firefox is closed)*

## First Time Setup

QueryVeil works great out of the box, but you can dial it in for maximum obfuscation:

1. Click the QueryVeil icon in your toolbar.
2. Hit **Start** to begin generating noise.
3. Click **Advanced Settings** at the bottom to customize your behavior:

### Recommended Settings for Maximum Obfuscation

- **Search Intensity:** Set to `Medium` or `High`. This dictates the raw volume of queries fired. 
- **Persona:** Pick a ghost profile (like "College Student" or "Remote Tech Worker"). Instead of random noise, trackers will waste their compute building a highly specific, totally fake profile of a person who doesn't exist.
- **Autosuggest Simulation:** Enable this. Real people don't magically drop full queries into search engines instantly. This feature sends partial typing requests first to mimic a real human keyboard user.
- **Real-Time Trend Injection:** Leave this enabled. It fetches trending topics locally and mixes them into the noise so the generated queries reflect what the world is currently searching.
- **Topics:** Keep as many checked as possible (at least 5+). More checked categories = higher entropy and harder-to-classify noise.

## Understanding the Privacy Score

In the popup UI, you'll see an **Obfuscation Estimate** (a score from 0-100 and a letter grade). This is calculated entirely locally on your machine.

It looks at your search volume, topic diversity, how long the extension has been running without interruption, and whether you're using advanced features like Personas and Autosuggest. 
Aim for a score in the green (80+) by letting the extension run continuously with a good mix of features enabled.

## Troubleshooting

**The Privacy Score is low:**
- Ensure you have a Persona selected.
- Turn on Autosuggest Simulation and Trend Injection.
- Make sure multiple topic categories are checked.
- Let the extension run for a while—consistency over time heavily improves the score.

**"Corrupted" or "Invalid" errors during manual install:**
- Make sure you select `manifest.json`, not the ZIP file or the folder itself.
- Check that you are running Firefox 112.0 or newer.

**Extension disappears after closing Firefox:**
- If using the temporary add-on via `about:debugging`, this is normal Firefox behavior.
- Install from the Firefox Add-ons store for persistence.

**High bandwidth/CPU usage:**
- Lower intensity to `Low`.
- Disable Result Click simulation (it loads full pages).
- Disable Autosuggest Simulation (it sends a few extra lightweight requests per search).
- Use the schedule feature to limit active hours.

**Queries not increasing:**
- Wait 5-10 minutes. The timing is statistically randomized and the extension simulates breaks just like a real human browsing session.
- Ensure your PC is not in a low-power sleep mode that completely suspends background scripts.
- Check the console (F12) for errors.
- Verify you're within scheduled hours if enabled.

## Need Help?

- Check the [README](README.md) for more details
- Report bugs on [GitHub Issues](https://github.com/NOTz00m/queryveil/issues)
- Review your query on [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/queryveil/)

## Uninstall

To completely remove QueryVeil:
1. Go to `about:addons` in Firefox
2. Find QueryVeil
3. Click "Remove"

All extension data is automatically and permanently deleted. No traces left behind.

---

**That's it!** 🛡️ Your searches are now significantly more private.
