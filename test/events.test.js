import test from 'node:test'
import assert from 'node:assert'
import { listUpcomingEvents, listPastEvents, getEvent } from '../src/events.js'

// Mock GraphQL response for events list
const mockEventsResponse = {
  repository: {
    issues: {
      edges: [
        {
          cursor: 'Y3Vyc29yOnYyOpK5MjAyNS0xMi0wMVQxMDowMDowMFo',
          node: {
            id: 'MDU6SXNzdWUxMjM',
            number: 123,
            title: 'Test Event 1',
            url: 'https://github.com/test/repo/issues/123',
            body: '### Event Title\nTest Event\n### Event Date\n2025-12-01',
            reactions: {
              nodes: [{ content: 'THUMBS_UP' }]
            },
            subIssues: {
              nodes: []
            }
          }
        }
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: 'Y3Vyc29yOnYyOpK5MjAyNS0xMi0wMVQxMDowMDowMFo'
      }
    }
  }
}

// Mock GraphQL response for single event
const mockEventResponse = {
  repository: {
    issue: {
      id: 'MDU6SXNzdWUxMjM',
      number: 123,
      title: 'Test Event 1',
      url: 'https://github.com/test/repo/issues/123',
      body: '### Event Title\nTest Event\n### Event Date\n2025-12-01',
      reactions: {
        nodes: [{ content: 'THUMBS_UP' }]
      },
      subIssues: {
        nodes: [
          {
            title: 'Talk 1',
            url: 'https://github.com/test/repo/issues/124',
            body: '### Talk Title\nTest Talk',
            reactions: {
              nodes: []
            },
            author: {
              login: 'speaker1',
              avatarUrl: 'https://avatars.githubusercontent.com/u/123',
              url: 'https://github.com/speaker1',
              name: 'Speaker One'
            }
          }
        ]
      }
    }
  }
}

test('listUpcomingEvents - fetches open events successfully', async () => {
  const mockGraphql = async (query, vars) => {
    assert.ok(query.includes('query'), 'Should pass GraphQL query')
    assert.strictEqual(vars.organization, 'testorg')
    assert.strictEqual(vars.repository, 'testrepo')
    assert.strictEqual(vars.state, 'OPEN')
    return mockEventsResponse
  }

  const results = await listUpcomingEvents(mockGraphql, 'testorg', 'testrepo')

  assert.strictEqual(results.length, 1)
  assert.strictEqual(results[0].title, 'Test Event 1')
  assert.strictEqual(results[0].number, 123)
})

test('listPastEvents - fetches closed events successfully', async () => {
  const mockGraphql = async (query, vars) => {
    assert.strictEqual(vars.state, 'CLOSED')
    return mockEventsResponse
  }

  const results = await listPastEvents(mockGraphql, 'testorg', 'testrepo')

  assert.strictEqual(results.length, 1)
  assert.strictEqual(results[0].title, 'Test Event 1')
})

test('getEvent - fetches single event successfully', async () => {
  const mockGraphql = async (query, vars) => {
    assert.strictEqual(vars.number, 123)
    return mockEventResponse
  }

  const results = await getEvent(mockGraphql, 'testorg', 'testrepo', 123)

  assert.strictEqual(results.length, 1)
  assert.strictEqual(results[0].title, 'Test Event 1')
  assert.strictEqual(results[0].talks.length, 1)
  assert.strictEqual(results[0].talks[0].title, 'Talk 1')
})

test('getEvent - includes date and author fields', async () => {
  const mockGraphql = async () => mockEventResponse

  const results = await getEvent(mockGraphql, 'testorg', 'testrepo', 123)

  // Verify date field exists
  assert.ok('date' in results[0], 'Event should have date field')

  // Verify talks have author field
  assert.strictEqual(results[0].talks.length, 1)
  assert.ok(results[0].talks[0].author, 'Talk should have author')
  assert.strictEqual(results[0].talks[0].author.login, 'speaker1')
  assert.strictEqual(results[0].talks[0].author.name, 'Speaker One')
})

test('listUpcomingEvents - validates required parameters', async () => {
  const mockGraphql = async () => mockEventsResponse

  await assert.rejects(
    async () => {
      await listUpcomingEvents(null, 'org', 'repo')
    },
    {
      message: /Missing required parameters/
    },
    'Should throw for missing graphql client'
  )

  await assert.rejects(
    async () => {
      await listUpcomingEvents(mockGraphql, null, 'repo')
    },
    {
      message: /Missing required parameters/
    },
    'Should throw for missing org'
  )

  await assert.rejects(
    async () => {
      await listUpcomingEvents(mockGraphql, 'org', null)
    },
    {
      message: /Missing required parameters/
    },
    'Should throw for missing repo'
  )
})

test('getEvent - validates required parameters', async () => {
  const mockGraphql = async () => mockEventResponse

  await assert.rejects(
    async () => {
      await getEvent(mockGraphql, 'org', 'repo', null)
    },
    {
      message: /Missing required parameters/
    },
    'Should throw for missing issue number'
  )
})

test('listUpcomingEvents - handles GraphQL errors', async () => {
  const mockGraphql = async () => {
    throw new Error('GraphQL API Error')
  }

  await assert.rejects(
    async () => {
      await listUpcomingEvents(mockGraphql, 'testorg', 'testrepo')
    },
    {
      message: /Failed to fetch upcoming events/
    },
    'Should wrap and rethrow GraphQL errors'
  )
})

test('listUpcomingEvents - respects pagination parameter', async () => {
  const mockGraphql = async (query, vars) => {
    assert.strictEqual(vars.first, 25)
    return mockEventsResponse
  }

  await listUpcomingEvents(mockGraphql, 'testorg', 'testrepo', { first: 25 })
})

test('getEvent - includes error context with issue number', async () => {
  const mockGraphql = async () => {
    throw new Error('Not found')
  }

  await assert.rejects(
    async () => {
      await getEvent(mockGraphql, 'testorg', 'testrepo', 999)
    },
    {
      message: /Failed to fetch event #999/
    },
    'Should include issue number in error message'
  )
})
