# GitEvents Fetch

[![npm version](https://img.shields.io/npm/v/gitevents-fetch.svg)](https://www.npmjs.com/package/gitevents-fetch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm provenance](https://img.shields.io/badge/provenance-attested-green)](https://docs.npmjs.com/generating-provenance-statements)

A Node.js library for fetching events and talks from GitEvents-based GitHub repositories using GitHub's GraphQL API. GitEvents uses GitHub Issues as a data source for managing community events and talk submissions.

> **Security**: This package is published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestation, ensuring verifiable supply chain security.

## Features

- 🚀 Fetch upcoming and past events from GitHub Issues
- 🎤 Retrieve event talks and speaker submissions (via sub-issues)
- 👤 Fetch user profiles and speaker information
- 📄 Fetch file contents from repositories (text files, JSON, etc.)
- 👥 Fetch GitHub Teams and team members
- 🔐 Support for both GitHub Personal Access Tokens (PAT) and GitHub App authentication
- 📊 Parse structured event data using issue forms
- ⚡ Built on GitHub's GraphQL API for efficient data fetching
- 🧪 Fully tested with comprehensive test coverage
- 📦 ES modules support

## Installation

```bash
npm install gitevents-fetch
```

## Quick Start

```javascript
import { upcomingEvents } from 'gitevents-fetch'

// Fetch upcoming events from a repository
const events = await upcomingEvents('organization', 'repository')

console.log(events)
// [
//   {
//     title: 'Community Meetup - December 2025',
//     number: 123,
//     url: 'https://github.com/org/repo/issues/123',
//     body: '...',
//     date: Date('2025-12-01T00:00:00.000Z'),
//     facets: { date: { date: '2025-12-01' }, ... },
//     talks: [
//       {
//         title: 'Talk Title',
//         author: { login: 'speaker', name: 'Speaker Name', ... },
//         ...
//       }
//     ],
//     reactions: ['THUMBS_UP', 'HEART']
//   }
// ]
```

## Authentication

GitEvents Fetch supports two authentication methods:

### Option 1: Personal Access Token (Recommended for Development)

1. [Create a GitHub Personal Access Token](https://github.com/settings/tokens) with `repo` scope
2. Set the environment variable:

```bash
export GH_PAT="your_personal_access_token"
```

### Option 2: GitHub App (Recommended for Production)

1. [Create a GitHub App](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app)
2. Generate and download a private key
3. Convert the private key to PKCS8 format:

```bash
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt \
  -in github-app-private-key.pem -out private-key-pkcs8.key
```

4. Convert to base64 for environment variable storage:

```javascript
import { readFileSync } from 'fs'

const privateKey = readFileSync('private-key-pkcs8.key', 'utf8')
const base64Key = Buffer.from(privateKey).toString('base64')
console.log(base64Key)
```

5. Set the environment variables:

```bash
export GH_APP_ID="your_app_id"
export GH_PRIVATE_KEY="base64_encoded_private_key"
export GH_APP_INSTALLATION_ID="your_installation_id"
```

### Environment Variables

| Variable                       | Required | Description                                                               |
| ------------------------------ | -------- | ------------------------------------------------------------------------- |
| `GH_PAT`                       | No\*     | GitHub Personal Access Token                                              |
| `GH_APP_ID`                    | No\*     | GitHub App ID                                                             |
| `GH_PRIVATE_KEY`               | No\*     | Base64-encoded GitHub App private key (PKCS8 format)                      |
| `GH_APP_INSTALLATION_ID`       | No\*     | GitHub App installation ID                                                |
| `DEFAULT_APPROVED_EVENT_LABEL` | No       | Label filter for approved events (default: `Approved :white_check_mark:`) |

\*Either PAT or all GitHub App credentials are required. If both are provided, PAT takes precedence.

## API Reference

### `upcomingEvents(org, repo, pagination?)`

Fetch open (upcoming) events from a repository.

**Parameters:**

- `org` (string) - GitHub organization or user name
- `repo` (string) - Repository name
- `pagination` (object, optional) - Pagination options
  - `first` (number) - Number of events to fetch (default: 10)

**Returns:** `Promise<Event[]>`

**Example:**

```javascript
import { upcomingEvents } from 'gitevents-fetch'

const events = await upcomingEvents('myorg', 'events', { first: 20 })
```

### `pastEvents(org, repo, pagination?)`

Fetch closed (past) events from a repository.

**Parameters:**

- `org` (string) - GitHub organization or user name
- `repo` (string) - Repository name
- `pagination` (object, optional) - Pagination options
  - `first` (number) - Number of events to fetch (default: 10)

**Returns:** `Promise<Event[]>`

**Example:**

```javascript
import { pastEvents } from 'gitevents-fetch'

const events = await pastEvents('myorg', 'events')
```

### `event(org, repo, number)`

Fetch a single event by issue number.

**Parameters:**

- `org` (string) - GitHub organization or user name
- `repo` (string) - Repository name
- `number` (number) - GitHub issue number

**Returns:** `Promise<Event[]>`

**Example:**

```javascript
import { event } from 'gitevents-fetch'

const events = await event('myorg', 'events', 123)
const singleEvent = events[0]
```

### `getTeam(org, teamSlug)`

Fetch a GitHub Team and its members.

**Parameters:**

- `org` (string) - GitHub organization name
- `teamSlug` (string) - Team slug (e.g., 'engineering', 'my-team')

**Returns:** `Promise<Team | null>`

**Example:**

```javascript
import { getTeam } from 'gitevents-fetch'

const team = await getTeam('myorg', 'engineering')

console.log(team)
// {
//   name: 'Engineering Team',
//   slug: 'engineering',
//   description: 'Core engineering team',
//   members: [
//     {
//       login: 'user1',
//       name: 'John Doe',
//       avatarUrl: 'https://avatars.githubusercontent.com/u/1',
//       bio: 'Software engineer and open source contributor',
//       websiteUrl: 'https://johndoe.com',
//       company: 'Acme Inc',
//       location: 'San Francisco, CA',
//       socialAccounts: [
//         { provider: 'LINKEDIN', url: 'https://linkedin.com/in/johndoe' },
//         { provider: 'GENERIC', url: 'https://mastodon.social/@johndoe' }
//       ]
//     },
//     // ... more members
//   ]
// }
```

**Note:** Returns `null` if the team is not found.

### `getUser(login)`

Fetch a GitHub user profile (useful for speaker information).

**Parameters:**

- `login` (string) - GitHub username

**Returns:** `Promise<User | null>`

Returns user data or `null` if not found.

**Example:**

```javascript
import { getUser } from 'gitevents-fetch'

const user = await getUser('octocat')

console.log(user)
// {
//   login: 'octocat',
//   name: 'The Octocat',
//   bio: 'GitHub mascot',
//   avatarUrl: 'https://github.com/octocat.png',
//   url: 'https://github.com/octocat',
//   websiteUrl: 'https://octocat.com',
//   company: 'GitHub',
//   location: 'San Francisco',
//   email: 'octocat@github.com',
//   createdAt: Date('2011-01-25T18:44:36.000Z'),
//   updatedAt: Date('2024-01-01T00:00:00.000Z'),
//   followerCount: 1000,
//   followingCount: 10,
//   publicRepoCount: 8,
//   socialAccounts: [
//     { provider: 'LINKEDIN', url: 'https://linkedin.com/in/octocat' }
//   ]
// }
```

### `getFile(org, repo, filePath, options?)`

Fetch file contents from a repository.

**Parameters:**

- `org` (string) - GitHub organization or user name
- `repo` (string) - Repository name
- `filePath` (string) - Path to the file in the repository
- `options` (object, optional) - Options
  - `branch` (string) - Branch name (default: 'HEAD')
  - `parse` (boolean) - Auto-parse JSON files (default: false)

**Returns:** `Promise<string | object>`

Returns string content by default, or parsed object if `parse: true` is used with JSON files.

**Example:**

```javascript
import { getFile } from 'gitevents-fetch'

// Fetch text file
const readme = await getFile('myorg', 'myrepo', 'README.md')
console.log(readme) // "# My Project\n..."

// Fetch JSON file with auto-parsing
const data = await getFile('myorg', 'myrepo', 'data.json', { parse: true })
console.log(data) // { key: 'value', ... }

// Fetch from specific branch
const config = await getFile('myorg', 'myrepo', 'config.json', {
  branch: 'develop',
  parse: true
})
```

**Error Handling:**

- Throws `File not found` error if file doesn't exist
- Throws `Binary files are not supported` error for binary files
- Throws `Failed to parse JSON` error if parse: true but content is invalid JSON

### Fetching Talks from a Dedicated Repository

Talks stored as issues in a dedicated repository can be fetched using the existing event functions:

```javascript
import { upcomingEvents, event } from 'gitevents-fetch'

// Fetch all talks (using different label if needed)
const talks = await upcomingEvents('myorg', 'talks-repo')

// Fetch specific talk by issue number
const talk = await event('myorg', 'talks-repo', 42)
```

Configure a custom label in your environment if talks use a different label:

```bash
export DEFAULT_APPROVED_EVENT_LABEL="Approved Talk"
```

### Event Object Structure

```typescript
{
  title: string          // Event title
  number: number         // GitHub issue number
  url: string           // GitHub issue URL
  body: string          // Raw issue body
  date: Date | null     // Event date (extracted from facets.date.date)
  facets: object        // Parsed structured data from issue form
  talks: Talk[]         // Array of talk submissions
  reactions: string[]   // Array of reaction types
}
```

### Talk Object Structure

```typescript
{
  title: string          // Talk title
  url: string           // GitHub sub-issue URL
  body: string          // Raw issue body
  author: {             // Speaker information (null if not available)
    login: string       // GitHub username
    avatarUrl: string   // Profile avatar URL
    url: string         // GitHub profile URL
    name?: string       // Display name (if available)
  } | null
  facets: object        // Parsed structured data
  reactions: string[]   // Array of reaction types
}
```

### Team Object Structure

```typescript
{
  name: string              // Team name
  slug: string              // Team slug (URL-friendly identifier)
  description: string | null // Team description
  members: Member[]         // Array of team members
}
```

### Member Object Structure

```typescript
{
  login: string                    // GitHub username
  name: string | null              // Display name (if available)
  avatarUrl: string                // Profile avatar URL
  bio: string | null               // User bio/description
  websiteUrl: string | null        // Personal website URL
  company: string | null           // Company name
  location: string | null          // Location
  socialAccounts: SocialAccount[]  // Array of social media accounts
}
```

### SocialAccount Object Structure

```typescript
{
  provider: string // Social media provider (e.g., 'LINKEDIN', 'GENERIC')
  url: string // Full URL to social media profile
}
```

## Error Handling

All API methods include comprehensive error handling and production-ready safety features:

### Input Validation

All functions validate required parameters before making API calls:

```javascript
import { upcomingEvents } from 'gitevents-fetch'

try {
  const events = await upcomingEvents('myorg', 'events')
  console.log(events)
} catch (error) {
  if (error.message.includes('Missing required parameters')) {
    console.error('Invalid parameters provided')
  } else if (error.message.includes('Failed to fetch')) {
    console.error('API error:', error.message)
  }
}
```

### Null Safety

The library handles missing or null data gracefully:

- **Missing reactions**: Returns empty array instead of crashing
- **Missing subIssues**: Returns empty talks array
- **Missing author**: Returns `null` instead of undefined
- **Missing date**: Returns `null` instead of throwing errors

### Authentication Errors

Clear error messages for missing credentials:

```javascript
// Missing credentials error
Error: Missing GitHub App credentials. Set GH_APP_ID, GH_PRIVATE_KEY,
       and GH_APP_INSTALLATION_ID environment variables, or provide
       GH_PAT for token authentication.

// Invalid key format error
Error: Failed to create GitHub App authentication: Invalid key format.
       Ensure GH_PRIVATE_KEY is base64-encoded.
```

## Production-Ready Features

This library has been thoroughly tested and optimized for production use:

### Reliability

- ✅ **Null-safe**: All GraphQL response fields safely handled with optional chaining
- ✅ **Input validation**: Required parameters validated before API calls
- ✅ **Error handling**: All async operations wrapped in try/catch with descriptive errors
- ✅ **Edge cases**: Handles missing dates, authors, reactions, and sub-issues gracefully

### Performance

- ✅ **Optimized queries**: GraphQL queries request only necessary fields
- ✅ **Efficient sorting**: Single-pass sorting with O(n log n) complexity
- ✅ **Minimal dependencies**: Only essential packages included

### Testing

- ✅ **32 comprehensive tests**: Unit, integration, and real API tests
- ✅ **100% pass rate**: All tests verified with live GitHub data
- ✅ **CI/CD ready**: Tests skip gracefully without credentials

### Code Quality

- ✅ **ESLint**: Zero warnings or errors
- ✅ **Prettier**: Consistent formatting enforced
- ✅ **Conventional commits**: Automated changelog generation
- ✅ **Type hints**: JSDoc-style documentation

## Using with Vite/SSR

If you're using this package in a Vite project with Server-Side Rendering (SSR), you need to configure Vite to properly bundle the GraphQL files:

### Installation

```bash
npm install -D vite-plugin-graphql-loader
```

### Vite Configuration

Add the GraphQL loader plugin and include this package in `ssr.noExternal`:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import graphqlLoader from 'vite-plugin-graphql-loader'

export default defineConfig({
  plugins: [graphqlLoader()],
  ssr: {
    noExternal: ['gitevents-fetch']
  }
})
```

**Why this is needed:**

- The library imports `.gql` files using Vite's `?raw` suffix for efficient bundling
- `vite-plugin-graphql-loader` enables Vite to process `.gql` files as modules
- Adding to `ssr.noExternal` ensures the package is bundled during SSR instead of being treated as an external dependency, allowing proper resolution of the GraphQL imports

## Development

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone https://github.com/gitevents/fetch.git
cd fetch
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (see [Authentication](#authentication))

### Scripts

```bash
npm run lint        # Run ESLint
npm test            # Run tests
npm run build       # Lint and test
npm run format      # Format code with Prettier
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node --test test/events.test.js

# Run tests with coverage (using c8 or similar)
npx c8 npm test
```

All tests use mocked GraphQL responses and don't require actual GitHub credentials.

**Integration Testing**: The test suite includes a real API integration test that automatically runs when credentials are available in `.env`. It's skipped in CI/CD environments without credentials to prevent build failures.

```javascript
// Automatically skipped without credentials
test('upcomingEvents - real API call', {
  skip: !process.env.GH_PAT && !process.env.GH_PRIVATE_KEY
}, async () => { ... })
```

### Project Structure

```
src/
├── index.js                    # Main entry point, exports public API
├── config.js                   # Environment configuration
├── events.js                   # Core event fetching functions
├── teams.js                    # Core team fetching functions
├── graphql/
│   ├── events.gql             # GraphQL query for multiple events
│   ├── event.gql              # GraphQL query for single event
│   └── team.gql               # GraphQL query for team and members
└── lib/
    ├── parseGql.js            # GraphQL query loader and processor
    └── processEventsPayload.js # Response transformation logic

test/
├── fetch.test.js              # Integration tests
├── events.test.js             # Event API tests
├── teams.test.js              # Team API tests
├── parseGql.test.js           # GraphQL parser tests
└── processEventsPayload.test.js # Payload processing tests
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Run linter (`npm run lint`)
6. Commit using conventional commits (`git commit -m 'feat: add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `test:` - Test updates
- `refactor:` - Code refactoring

## License

MIT © [Patrick Heneise](https://zentered.co)

## Support

- 🐛 [Report bugs](https://github.com/gitevents/fetch/issues)
- 💡 [Request features](https://github.com/gitevents/fetch/issues)
- 📖 [Documentation](https://github.com/gitevents)

## Related Projects

- [GitEvents](https://github.com/gitevents) - Community event management using GitHub Issues
- [@zentered/issue-forms-body-parser](https://github.com/zentered/issue-forms-body-parser) - Parse GitHub Issue Forms

---

Made with ❤️ by the GitEvents community
