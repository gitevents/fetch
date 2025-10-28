import test from 'node:test'
import assert from 'node:assert'

test('index exports - validates public API', async () => {
  // Skip actual API calls in tests, but validate exports exist
  const indexModule = await import('../src/index.js')

  assert.ok(
    typeof indexModule.upcomingEvents === 'function',
    'Should export upcomingEvents function'
  )
  assert.ok(
    typeof indexModule.pastEvents === 'function',
    'Should export pastEvents function'
  )
  assert.ok(
    typeof indexModule.event === 'function',
    'Should export event function'
  )
  assert.ok(
    typeof indexModule.getTeam === 'function',
    'Should export getTeam function'
  )
})

test('index exports - validates parameter requirements', async () => {
  const { upcomingEvents } = await import('../src/index.js')

  // These should throw validation errors before trying to make API calls
  await assert.rejects(
    async () => {
      await upcomingEvents(null, 'repo')
    },
    {
      message: /Missing required parameters/
    },
    'Should validate org parameter'
  )

  await assert.rejects(
    async () => {
      await upcomingEvents('org', null)
    },
    {
      message: /Missing required parameters/
    },
    'Should validate repo parameter'
  )
})

// Integration test with real API - using credentials from .env
// Skip by default to avoid failures when credentials are not available
test(
  'upcomingEvents - real API call',
  {
    skip: !process.env.GH_PAT && !process.env.GH_PRIVATE_KEY
  },
  async () => {
    const { upcomingEvents } = await import('../src/index.js')

    // Using boulder-js/events from .env
    const results = await upcomingEvents('boulder-js', 'events')

    assert.ok(Array.isArray(results), 'Should return an array')
    assert.ok(results.length >= 0, 'Should return valid results')

    // If there are results, verify structure
    if (results.length > 0) {
      const event = results[0]
      assert.ok(event.title, 'Event should have title')
      assert.ok(event.number, 'Event should have issue number')
      assert.ok(event.url, 'Event should have URL')
      assert.ok('date' in event, 'Event should have date field')
      assert.ok(event.facets, 'Event should have facets')
      assert.ok(Array.isArray(event.talks), 'Event should have talks array')
      assert.ok(
        Array.isArray(event.reactions),
        'Event should have reactions array'
      )

      // If there are talks, verify author field
      if (event.talks.length > 0) {
        const talk = event.talks[0]
        assert.ok('author' in talk, 'Talk should have author field')
        assert.ok(talk.title, 'Talk should have title')
      }
    }
  }
)
