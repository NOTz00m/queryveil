# Contributing to QueryVeil

Thanks for your interest in contributing. Here's how you can help.

## Translation Review

The multilingual query templates in `background/queryLanguages.js` were initially generated with AI assistance (Claude). While the phrases are functional, native speaker review makes a huge difference for realism. Bad grammar in generated queries is a dead giveaway that they're fake.

### Current Translation Contributors

| Language   | Contributor           | Status     |
| ---------- | --------------------- | ---------- |
| Spanish    | `EthereaOne`          | Reviewed   |
| French     | `sky.dev`             | Reviewed   |
| German     | **needs contributor** | Unreviewed |
| Portuguese | `HomoSapien`          | Reviewed   |
| Japanese   | **needs contributor** | Unreviewed |
| Korean     | `kuro_99`             | Reviewed   |
| Arabic     | **needs contributor** | Unreviewed |
| Hindi      | **needs contributor** | Unreviewed |
| Italian    | **needs contributor** | Unreviewed |
| Dutch      | **needs contributor** | Unreviewed |
| Turkish    | **needs contributor** | Unreviewed |
| Polish     | `OlushDev`            | Reviewed   |
| Russian    | **needs contributor** | Unreviewed |

The larger query pools are currently limited to Spanish, French, Portuguese, Korean, Polish, and Russian. Russian however still needs native speaker review.

### How to Review Translations

1. Open `background/queryLanguages.js`
2. Find your language's section
3. Check that:
   - Keywords are things people actually type when searching
   - Entities reference real local services, brands, or concepts
   - Templates produce grammatically natural queries
   - Phrasing matches how native speakers actually use search engines (not formal or textbook language)
4. Submit a PR with your fixes

### Adding a New Language

If you want to add a language that's not listed:

1. Add a new entry to the `buildLanguages()` method in `queryLanguages.js`
2. Include at minimum: `code`, `name`, `acceptLanguage`, `searchParams`, `keywords` (15+), `entities` (15+), `templates` (10+)
3. Add a keyboard layout entry in `getKeyboardLayout()` if your language uses a non-QWERTY layout
4. Add the language to the options page dropdown in `options/options.html`
5. Add yourself to the contributor table above

## Code Contributions

- Keep everything local. No external API calls, no telemetry, no data leaving the browser.
- Match the existing comment style (lowercase, no em dashes, keep it casual).
- Test in Firefox using `about:debugging` before submitting.
- If you change timing or statistical distributions, explain why in the PR description.

## Bug Reports

Open an issue with:

- Firefox version
- Steps to reproduce
- Expected vs actual behavior
- Console errors if any (enable Debug Mode in settings)

## AI Disclosure

AI tools were used during development of this project for:

- Generating multilingual query templates and culturally appropriate search phrases
- These translations have been reviewed by the contributors listed above (except certain languages, which still need review)

If you use AI tools to generate content for a PR, please disclose it. We don't have a problem with it, we just want transparency.
