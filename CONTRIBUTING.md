# Contributing to QueryVeil

Thank you for your interest in contributing to QueryVeil! This is a privacy-focused project, so we have specific guidelines to ensure all contributions maintain our security and privacy standards.

## Code of Conduct

### Our Standards

- **Privacy First**: Never compromise user privacy
- **Security Conscious**: All code must be reviewed for security implications
- **Transparency**: Document what your code does and why
- **User Respect**: Consider impact on users' resources and trust

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Use the bug report template
3. Include:
   - Firefox version
   - Extension version
   - Steps to reproduce
   - Expected vs actual behavior
   - Console logs (if relevant)

### Suggesting Features

1. Explain the privacy/security benefit
2. Consider resource impact
3. Propose implementation approach

### Submitting Code

#### Before You Start

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Set up your development environment (just load in Firefox)

#### Coding Standards

**JavaScript Style**
```javascript
// Use modern ES6+ features
const myFunction = async () => {
  // Clear, descriptive variable names
  const queryDelay = calculateDelay();
  
  // Comment complex logic
  // This uses exponential distribution to mimic human timing
  return exponentialRandom(queryDelay);
};

// Document public functions
/**
 * Calculate realistic query delay
 * @param {Object} settings - User settings
 * @returns {number} Delay in milliseconds
 */
function calculateDelay(settings) {
  // Implementation
}
```

**Privacy Rules**
- Never log sensitive data
- No external API calls (except to search engines)
- No telemetry or analytics
- Minimize data storage
- Use crypto.getRandomValues() for randomness, not Math.random() for security-critical operations

**Security Rules**
- No eval() or Function() constructor
- No innerHTML (use textContent or DOM methods)
- Validate all user inputs
- Follow Content Security Policy
- No external dependencies without thorough review

#### Testing Your Changes

1. Load extension in Firefox Developer Edition
2. Test with debug mode enabled
3. Check browser console for errors
4. Verify queries look human-like
5. Test all UI changes in popup and options
6. Verify no new permissions are needed
7. Check that settings persist correctly

#### Commit Guidelines

```bash
# Good commit messages
git commit -m "Add exponential backoff to rate limiting"
git commit -m "Fix typo in Italian query generation"
git commit -m "Improve session clustering algorithm"

# Bad commit messages
git commit -m "fix bug"
git commit -m "update code"
git commit -m "changes"
```

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting)
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

#### Pull Request Process

1. Update README.md if needed
2. Update ARCHITECTURE.md for major changes
3. Test thoroughly in Firefox
4. Fill out the PR template completely
5. Request review from maintainers

**PR Checklist:**
- [ ] Code follows privacy guidelines
- [ ] No new external dependencies
- [ ] No new permissions required (or justified)
- [ ] Tested in Firefox
- [ ] Documentation updated
- [ ] Commits are clean and descriptive

### Documentation

Good documentation helps users and contributors:

- Update README.md for user-facing changes
- Update ARCHITECTURE.md for technical changes
- Comment complex algorithms
- Add JSDoc comments to functions
- Update privacy policy if data handling changes

## Development Setup

### Prerequisites
- Firefox Developer Edition (recommended) or Firefox stable
- Text editor (VS Code, Sublime, etc.)
- Git

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/queryveil.git
cd queryveil

# Create a branch
git checkout -b feature/my-feature

# Load in Firefox
# 1. Open Firefox
# 2. Go to about:debugging#/runtime/this-firefox
# 3. Click "Load Temporary Add-on"
# 4. Select manifest.json

# Make changes, test, commit
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature

# Open PR on GitHub
```

### Debugging

**Enable Debug Mode:**
1. Click QueryVeil icon
2. Go to Advanced Settings
3. Enable "Debug Mode"
4. Open browser console (F12)
5. See logged queries and events

**Common Debug Tasks:**
```javascript
// Access extension object in console
queryVeil.behaviorSim.getSessionInfo()
queryVeil.antiDetect.getStats()
queryVeil.statistics

// Manually trigger query
browser.runtime.sendMessage({ type: 'generateNow' })
```

## Areas for Contribution

### High Priority
- [ ] Chrome/Edge compatibility testing
- [ ] Multi-language query support
- [ ] Improved Markov chain training
- [ ] ML classifier evasion testing
- [ ] Accessibility improvements

### Medium Priority
- [ ] Additional topic categories
- [ ] Better typo simulation
- [ ] Result page interaction improvements
- [ ] Battery usage optimization
- [ ] Dark mode for UI

### Low Priority
- [ ] Custom query templates
- [ ] Import/export settings
- [ ] Query preview mode
- [ ] Statistics visualization

### Research Needed
- [ ] GPT-2 integration (local, privacy-preserving)
- [ ] Adversarial training against classifiers
- [ ] User behavior learning (privacy-preserving)
- [ ] Tor integration

## Code Review Process

All contributions go through code review:

1. **Automated Checks** (when CI is set up)
   - Linting
   - Manifest validation
   - Security scanning

2. **Manual Review**
   - Privacy implications
   - Security concerns
   - Code quality
   - Documentation
   - Testing coverage

3. **Testing**
   - Maintainer tests in Firefox
   - Community testing for major features

4. **Approval**
   - At least one maintainer approval
   - All comments addressed
   - CI passing (when available)

## Security Vulnerabilities

We'll work with you to:
- Verify the vulnerability
- Develop a fix
- Coordinate disclosure
- Credit you (if desired)

## Recognition

Contributors are recognized:
- In CONTRIBUTORS.md
- In release notes
- In the extension's about page

## Questions?

- Ask in your PR or issue

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
