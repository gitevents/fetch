import test from 'node:test'
import assert from 'node:assert'
import { getUser } from '../src/users.js'

test('getUser - validates required parameters', async () => {
  await assert.rejects(
    async () => {
      await getUser(null, 'username')
    },
    {
      message: /Missing required parameters/
    },
    'Should validate graphql parameter'
  )

  await assert.rejects(
    async () => {
      const mockGraphql = () => {}
      await getUser(mockGraphql, null)
    },
    {
      message: /Missing required parameters/
    },
    'Should validate login parameter'
  )
})

test('getUser - fetches user successfully', async () => {
  const mockGraphql = async () => ({
    user: {
      login: 'testuser',
      name: 'Test User',
      bio: 'I am a test user',
      avatarUrl: 'https://github.com/testuser.png',
      url: 'https://github.com/testuser',
      websiteUrl: 'https://testuser.com',
      company: 'Test Company',
      location: 'Test City',
      email: 'test@example.com',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      followers: {
        totalCount: 100
      },
      following: {
        totalCount: 50
      },
      repositories: {
        totalCount: 25
      },
      socialAccounts: {
        nodes: [
          {
            provider: 'LINKEDIN',
            url: 'https://linkedin.com/in/testuser'
          },
          {
            provider: 'TWITTER',
            url: 'https://twitter.com/testuser'
          }
        ]
      }
    }
  })

  const result = await getUser(mockGraphql, 'testuser')

  assert.equal(result.login, 'testuser')
  assert.equal(result.name, 'Test User')
  assert.equal(result.bio, 'I am a test user')
  assert.equal(result.avatarUrl, 'https://github.com/testuser.png')
  assert.equal(result.url, 'https://github.com/testuser')
  assert.equal(result.websiteUrl, 'https://testuser.com')
  assert.equal(result.company, 'Test Company')
  assert.equal(result.location, 'Test City')
  assert.equal(result.email, 'test@example.com')
  assert.ok(result.createdAt instanceof Date)
  assert.ok(result.updatedAt instanceof Date)
  assert.equal(result.followerCount, 100)
  assert.equal(result.followingCount, 50)
  assert.equal(result.publicRepoCount, 25)
  assert.equal(result.socialAccounts.length, 2)
  assert.equal(result.socialAccounts[0].provider, 'LINKEDIN')
  assert.equal(result.socialAccounts[0].url, 'https://linkedin.com/in/testuser')
})

test('getUser - handles missing optional fields', async () => {
  const mockGraphql = async () => ({
    user: {
      login: 'testuser',
      name: null,
      bio: null,
      avatarUrl: 'https://github.com/testuser.png',
      url: 'https://github.com/testuser',
      websiteUrl: null,
      company: null,
      location: null,
      email: null,
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: null,
      followers: null,
      following: null,
      repositories: null,
      socialAccounts: null
    }
  })

  const result = await getUser(mockGraphql, 'testuser')

  assert.equal(result.name, null)
  assert.equal(result.bio, null)
  assert.equal(result.websiteUrl, null)
  assert.equal(result.company, null)
  assert.equal(result.location, null)
  assert.equal(result.email, null)
  assert.equal(result.updatedAt, null)
  assert.equal(result.followerCount, 0)
  assert.equal(result.followingCount, 0)
  assert.equal(result.publicRepoCount, 0)
  assert.deepEqual(result.socialAccounts, [])
})

test('getUser - returns null if user not found', async () => {
  const mockGraphql = async () => ({
    user: null
  })

  const result = await getUser(mockGraphql, 'nonexistentuser')

  assert.equal(result, null)
})

test('getUser - handles GraphQL errors', async () => {
  const mockGraphql = async () => {
    throw new Error('API rate limit exceeded')
  }

  await assert.rejects(
    async () => {
      await getUser(mockGraphql, 'testuser')
    },
    {
      message: /Failed to fetch user: API rate limit exceeded/
    },
    'Should wrap GraphQL errors'
  )
})

// Integration test with real API
test(
  'getUser - real API call',
  {
    skip: !process.env.GH_PAT && !process.env.GH_PRIVATE_KEY
  },
  async () => {
    const { getUser: getUserAPI } = await import('../src/index.js')

    // Fetch octocat user (GitHub's official mascot account)
    const user = await getUserAPI('octocat')

    assert.ok(user, 'Should return user data')
    assert.equal(user.login, 'octocat')
    assert.ok(user.avatarUrl, 'Should have avatar URL')
    assert.ok(user.url, 'Should have profile URL')
    assert.ok('name' in user, 'Should have name field')
    assert.ok('bio' in user, 'Should have bio field')
    assert.ok(
      typeof user.followerCount === 'number',
      'Should have follower count'
    )
    assert.ok(
      typeof user.followingCount === 'number',
      'Should have following count'
    )
    assert.ok(
      typeof user.publicRepoCount === 'number',
      'Should have repo count'
    )
    assert.ok(
      Array.isArray(user.socialAccounts),
      'Should have social accounts array'
    )
  }
)
