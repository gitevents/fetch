import test from 'node:test'
import assert from 'node:assert'
import { listDiscussions } from '../src/discussions.js'

test('listDiscussions - validates required parameters', async () => {
  await assert.rejects(
    async () => {
      await listDiscussions(null, 'repo')
    },
    {
      message: /Missing required parameters/
    },
    'Should validate graphql parameter'
  )

  await assert.rejects(
    async () => {
      const mockGraphql = () => {}
      await listDiscussions(mockGraphql, null, 'repo')
    },
    {
      message: /Missing required parameters/
    },
    'Should validate org parameter'
  )

  await assert.rejects(
    async () => {
      const mockGraphql = () => {}
      await listDiscussions(mockGraphql, 'org', null)
    },
    {
      message: /Missing required parameters/
    },
    'Should validate repo parameter'
  )
})

test('listDiscussions - processes valid response', async () => {
  const mockGraphql = async () => ({
    repository: {
      discussions: {
        edges: [
          {
            node: {
              id: 'D_123',
              number: 1,
              title: 'Test Discussion',
              url: 'https://github.com/org/repo/discussions/1',
              body: 'Discussion body',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z',
              author: {
                login: 'testuser',
                name: 'Test User',
                avatarUrl: 'https://github.com/testuser.png',
                url: 'https://github.com/testuser'
              },
              category: {
                id: 'CAT_123',
                name: 'Announcements',
                emoji: '📢',
                description: 'Important announcements'
              },
              reactions: {
                nodes: [{ content: 'THUMBS_UP' }, { content: 'HEART' }]
              },
              comments: {
                totalCount: 5
              }
            }
          }
        ]
      }
    }
  })

  const result = await listDiscussions(mockGraphql, 'org', 'repo')

  assert.ok(Array.isArray(result), 'Should return an array')
  assert.equal(result.length, 1, 'Should return one discussion')

  const discussion = result[0]
  assert.equal(discussion.id, 'D_123')
  assert.equal(discussion.number, 1)
  assert.equal(discussion.title, 'Test Discussion')
  assert.equal(discussion.url, 'https://github.com/org/repo/discussions/1')
  assert.equal(discussion.body, 'Discussion body')
  assert.ok(discussion.createdAt instanceof Date, 'createdAt should be a Date')
  assert.ok(discussion.updatedAt instanceof Date, 'updatedAt should be a Date')
  assert.equal(discussion.author.login, 'testuser')
  assert.equal(discussion.author.name, 'Test User')
  assert.equal(discussion.category.name, 'Announcements')
  assert.equal(discussion.category.emoji, '📢')
  assert.deepEqual(discussion.reactions, ['THUMBS_UP', 'HEART'])
  assert.equal(discussion.commentCount, 5)
})

test('listDiscussions - handles empty results', async () => {
  const mockGraphql = async () => ({
    repository: {
      discussions: {
        edges: []
      }
    }
  })

  const result = await listDiscussions(mockGraphql, 'org', 'repo')

  assert.ok(Array.isArray(result), 'Should return an array')
  assert.equal(result.length, 0, 'Should return empty array')
})

test('listDiscussions - handles missing optional fields', async () => {
  const mockGraphql = async () => ({
    repository: {
      discussions: {
        edges: [
          {
            node: {
              id: 'D_123',
              number: 1,
              title: 'Test Discussion',
              url: 'https://github.com/org/repo/discussions/1',
              body: null,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null,
              author: null,
              category: null,
              reactions: null,
              comments: null
            }
          }
        ]
      }
    }
  })

  const result = await listDiscussions(mockGraphql, 'org', 'repo')

  assert.equal(result.length, 1)
  const discussion = result[0]
  assert.equal(discussion.body, null)
  assert.equal(discussion.updatedAt, null)
  assert.equal(discussion.author, null)
  assert.equal(discussion.category, null)
  assert.deepEqual(discussion.reactions, [])
  assert.equal(discussion.commentCount, 0)
})

test('listDiscussions - respects options', async () => {
  const mockGraphql = async (query, vars) => {
    assert.equal(vars.first, 20, 'Should pass first option')
    assert.equal(vars.categoryId, 'CAT_123', 'Should pass categoryId option')
    return {
      repository: {
        discussions: {
          edges: []
        }
      }
    }
  }

  await listDiscussions(mockGraphql, 'org', 'repo', {
    first: 20,
    categoryId: 'CAT_123'
  })
})

test('listDiscussions - handles GraphQL errors', async () => {
  const mockGraphql = async () => {
    throw new Error('API rate limit exceeded')
  }

  await assert.rejects(
    async () => {
      await listDiscussions(mockGraphql, 'org', 'repo')
    },
    {
      message: /Failed to fetch discussions: API rate limit exceeded/
    },
    'Should wrap GraphQL errors'
  )
})

// Integration test with real API
test(
  'discussions - real API call',
  {
    skip: !process.env.GH_PAT && !process.env.GH_PRIVATE_KEY
  },
  async () => {
    const { discussions } = await import('../src/index.js')

    // Using cyprus-developer-community/home which has discussions
    const results = await discussions('cyprus-developer-community', 'home', {
      first: 5
    })

    assert.ok(Array.isArray(results), 'Should return an array')
    assert.ok(results.length >= 0, 'Should return valid results')

    // If there are results, verify structure
    if (results.length > 0) {
      const discussion = results[0]
      assert.ok(discussion.id, 'Discussion should have id')
      assert.ok(discussion.number, 'Discussion should have number')
      assert.ok(discussion.title, 'Discussion should have title')
      assert.ok(discussion.url, 'Discussion should have URL')
      assert.ok('body' in discussion, 'Discussion should have body field')
      assert.ok(
        discussion.createdAt instanceof Date,
        'Discussion should have createdAt Date'
      )
      assert.ok('author' in discussion, 'Discussion should have author field')
      assert.ok(
        'category' in discussion,
        'Discussion should have category field'
      )
      assert.ok(
        Array.isArray(discussion.reactions),
        'Discussion should have reactions array'
      )
      assert.ok(
        typeof discussion.commentCount === 'number',
        'Discussion should have commentCount'
      )
    }
  }
)
