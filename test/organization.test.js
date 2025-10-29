import test from 'node:test'
import assert from 'node:assert'
import { getOrganization } from '../src/organization.js'

test('getOrganization - validates required parameters', async () => {
  await assert.rejects(
    async () => {
      await getOrganization(null, 'org')
    },
    {
      message: /Missing required parameters/
    },
    'Should validate graphql parameter'
  )

  await assert.rejects(
    async () => {
      const mockGraphql = () => {}
      await getOrganization(mockGraphql, null)
    },
    {
      message: /Missing required parameters/
    },
    'Should validate org parameter'
  )
})

test('getOrganization - fetches organization successfully', async () => {
  const mockGraphql = async () => ({
    organization: {
      name: 'Test Organization',
      login: 'test-org',
      description: 'A test organization',
      websiteUrl: 'https://test-org.com',
      avatarUrl: 'https://github.com/test-org.png',
      email: 'hello@test-org.com',
      location: 'San Francisco, CA',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      membersWithRole: {
        totalCount: 42
      },
      repositories: {
        totalCount: 128
      }
    }
  })

  const result = await getOrganization(mockGraphql, 'test-org')

  assert.equal(result.name, 'Test Organization')
  assert.equal(result.login, 'test-org')
  assert.equal(result.description, 'A test organization')
  assert.equal(result.websiteUrl, 'https://test-org.com')
  assert.equal(result.avatarUrl, 'https://github.com/test-org.png')
  assert.equal(result.email, 'hello@test-org.com')
  assert.equal(result.location, 'San Francisco, CA')
  assert.ok(result.createdAt instanceof Date)
  assert.ok(result.updatedAt instanceof Date)
  assert.equal(result.memberCount, 42)
  assert.equal(result.publicRepoCount, 128)
})

test('getOrganization - handles missing optional fields', async () => {
  const mockGraphql = async () => ({
    organization: {
      name: 'Test Org',
      login: 'test-org',
      description: null,
      websiteUrl: null,
      avatarUrl: 'https://github.com/test-org.png',
      email: null,
      location: null,
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: null,
      membersWithRole: {
        totalCount: 5
      },
      repositories: null
    }
  })

  const result = await getOrganization(mockGraphql, 'test-org')

  assert.equal(result.description, null)
  assert.equal(result.websiteUrl, null)
  assert.equal(result.email, null)
  assert.equal(result.location, null)
  assert.equal(result.updatedAt, null)
  assert.equal(result.publicRepoCount, 0)
})

test('getOrganization - returns null if organization not found', async () => {
  const mockGraphql = async () => ({
    organization: null
  })

  const result = await getOrganization(mockGraphql, 'nonexistent-org')

  assert.equal(result, null)
})

test('getOrganization - handles GraphQL errors', async () => {
  const mockGraphql = async () => {
    throw new Error('API rate limit exceeded')
  }

  await assert.rejects(
    async () => {
      await getOrganization(mockGraphql, 'test-org')
    },
    {
      message: /Failed to fetch organization: API rate limit exceeded/
    },
    'Should wrap GraphQL errors'
  )
})

// Integration test with real API
test(
  'getOrganization - real API call',
  {
    skip: !process.env.GH_PAT && !process.env.GH_PRIVATE_KEY
  },
  async () => {
    const { getOrganization: getOrgAPI } = await import('../src/index.js')

    // Fetch gitevents organization
    const org = await getOrgAPI('gitevents')

    assert.ok(org, 'Should return organization data')
    assert.equal(org.login, 'gitevents')
    assert.ok(org.name, 'Should have name')
    assert.ok(typeof org.memberCount === 'number', 'Should have member count')
    assert.ok(
      typeof org.publicRepoCount === 'number',
      'Should have public repo count'
    )
    assert.ok('description' in org, 'Should have description field')
    assert.ok('websiteUrl' in org, 'Should have websiteUrl field')
    assert.ok(org.avatarUrl, 'Should have avatar URL')
  }
)
