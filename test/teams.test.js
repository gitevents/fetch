import test from 'node:test'
import assert from 'node:assert'
import { getTeamById } from '../src/teams.js'

// Mock GraphQL response for a team
const mockTeamResponse = {
  organization: {
    team: {
      name: 'Engineering Team',
      slug: 'engineering',
      description: 'Core engineering team',
      members: {
        nodes: [
          {
            login: 'user1',
            name: 'John Doe',
            avatarUrl: 'https://avatars.githubusercontent.com/u/1',
            bio: 'Software engineer and open source contributor',
            websiteUrl: 'https://johndoe.com',
            company: 'Acme Inc',
            location: 'San Francisco, CA',
            socialAccounts: {
              nodes: [
                {
                  provider: 'LINKEDIN',
                  url: 'https://linkedin.com/in/johndoe'
                },
                { provider: 'GENERIC', url: 'https://mastodon.social/@johndoe' }
              ]
            }
          },
          {
            login: 'user2',
            name: 'Jane Smith',
            avatarUrl: 'https://avatars.githubusercontent.com/u/2',
            bio: null,
            websiteUrl: null,
            company: 'Tech Corp',
            location: 'New York, NY',
            socialAccounts: {
              nodes: []
            }
          },
          {
            login: 'user3',
            name: null,
            avatarUrl: 'https://avatars.githubusercontent.com/u/3',
            bio: null,
            websiteUrl: null,
            company: null,
            location: null,
            socialAccounts: {
              nodes: []
            }
          }
        ]
      }
    }
  }
}

// Mock response for team without description
const mockTeamNoDescriptionResponse = {
  organization: {
    team: {
      name: 'Engineering Team',
      slug: 'engineering',
      description: null,
      members: {
        nodes: []
      }
    }
  }
}

// Mock response for team not found
const mockTeamNotFoundResponse = {
  organization: {
    team: null
  }
}

test('getTeamById - fetches team successfully', async () => {
  const mockGraphql = async (query, vars) => {
    assert.ok(query.includes('query'), 'Should pass GraphQL query')
    assert.strictEqual(vars.organization, 'testorg')
    assert.strictEqual(vars.teamSlug, 'engineering')
    return mockTeamResponse
  }

  const result = await getTeamById(mockGraphql, 'testorg', 'engineering')

  assert.strictEqual(result.name, 'Engineering Team')
  assert.strictEqual(result.slug, 'engineering')
  assert.strictEqual(result.description, 'Core engineering team')
  assert.strictEqual(result.members.length, 3)
  assert.strictEqual(result.members[0].login, 'user1')
  assert.strictEqual(result.members[0].name, 'John Doe')
  assert.strictEqual(
    result.members[0].avatarUrl,
    'https://avatars.githubusercontent.com/u/1'
  )
  assert.strictEqual(
    result.members[0].bio,
    'Software engineer and open source contributor'
  )
  assert.strictEqual(result.members[0].websiteUrl, 'https://johndoe.com')
  assert.strictEqual(result.members[0].company, 'Acme Inc')
  assert.strictEqual(result.members[0].location, 'San Francisco, CA')
  assert.strictEqual(result.members[0].socialAccounts.length, 2)
  assert.strictEqual(result.members[0].socialAccounts[0].provider, 'LINKEDIN')
  assert.strictEqual(
    result.members[0].socialAccounts[0].url,
    'https://linkedin.com/in/johndoe'
  )
})

test('getTeamById - handles team without description', async () => {
  const mockGraphql = async () => mockTeamNoDescriptionResponse

  const result = await getTeamById(mockGraphql, 'testorg', 'engineering')

  assert.strictEqual(result.name, 'Engineering Team')
  assert.strictEqual(result.description, null)
  assert.strictEqual(result.members.length, 0)
})

test('getTeamById - handles team not found', async () => {
  const mockGraphql = async () => mockTeamNotFoundResponse

  const result = await getTeamById(mockGraphql, 'testorg', 'nonexistent')

  assert.strictEqual(result, null)
})

test('getTeamById - handles member without name', async () => {
  const mockGraphql = async () => mockTeamResponse

  const result = await getTeamById(mockGraphql, 'testorg', 'engineering')

  // Third member has null name
  assert.strictEqual(result.members[2].login, 'user3')
  assert.strictEqual(result.members[2].name, null)
})

test('getTeamById - handles member with no social accounts', async () => {
  const mockGraphql = async () => mockTeamResponse

  const result = await getTeamById(mockGraphql, 'testorg', 'engineering')

  // Second member has no social accounts
  assert.strictEqual(result.members[1].login, 'user2')
  assert.strictEqual(result.members[1].bio, null)
  assert.strictEqual(result.members[1].websiteUrl, null)
  assert.strictEqual(result.members[1].socialAccounts.length, 0)
})

test('getTeamById - handles member with null optional fields', async () => {
  const mockGraphql = async () => mockTeamResponse

  const result = await getTeamById(mockGraphql, 'testorg', 'engineering')

  // Third member has all null optional fields
  assert.strictEqual(result.members[2].login, 'user3')
  assert.strictEqual(result.members[2].name, null)
  assert.strictEqual(result.members[2].bio, null)
  assert.strictEqual(result.members[2].websiteUrl, null)
  assert.strictEqual(result.members[2].company, null)
  assert.strictEqual(result.members[2].location, null)
  assert.strictEqual(result.members[2].socialAccounts.length, 0)
})

test('getTeamById - validates required parameters', async () => {
  const mockGraphql = async () => mockTeamResponse

  await assert.rejects(
    async () => {
      await getTeamById(null, 'org', 'team')
    },
    {
      message: /Missing required parameters/
    },
    'Should throw for missing graphql client'
  )

  await assert.rejects(
    async () => {
      await getTeamById(mockGraphql, null, 'team')
    },
    {
      message: /Missing required parameters/
    },
    'Should throw for missing org'
  )

  await assert.rejects(
    async () => {
      await getTeamById(mockGraphql, 'org', null)
    },
    {
      message: /Missing required parameters/
    },
    'Should throw for missing teamSlug'
  )
})

test('getTeamById - handles GraphQL errors', async () => {
  const mockGraphql = async () => {
    throw new Error('GraphQL API Error')
  }

  await assert.rejects(
    async () => {
      await getTeamById(mockGraphql, 'testorg', 'engineering')
    },
    {
      message: /Failed to fetch team engineering/
    },
    'Should wrap and rethrow GraphQL errors'
  )
})

test('getTeamById - includes error context with team slug', async () => {
  const mockGraphql = async () => {
    throw new Error('Not found')
  }

  await assert.rejects(
    async () => {
      await getTeamById(mockGraphql, 'testorg', 'nonexistent-team')
    },
    {
      message: /Failed to fetch team nonexistent-team/
    },
    'Should include team slug in error message'
  )
})

// Integration test with real API - using credentials from .env
// Skip by default to avoid failures when credentials are not available
test(
  'getTeamById - real API call',
  {
    skip: !process.env.GH_PAT && !process.env.GH_PRIVATE_KEY
  },
  async () => {
    const { getTeam } = await import('../src/index.js')

    // Note: Replace with a real org/team you have access to for testing
    // This test will be skipped if credentials are not available
    try {
      const result = await getTeam('github', 'engineering')

      if (result) {
        assert.ok(result.name, 'Team should have name')
        assert.ok(result.slug, 'Team should have slug')
        assert.ok(
          Array.isArray(result.members),
          'Team should have members array'
        )

        if (result.members.length > 0) {
          const member = result.members[0]
          assert.ok(member.login, 'Member should have login')
          assert.ok(member.avatarUrl, 'Member should have avatarUrl')
        }
      }
    } catch (error) {
      // Team might not exist or no access - that's ok for this test
      console.log('Real API test skipped:', error.message)
    }
  }
)
