import test from 'node:test'
import assert from 'node:assert'

test('index exports - validates public API', async () => {
  const indexModule = await import('../src/index.js')
  const expectedExports = [
    'upcomingEvents',
    'pastEvents',
    'event',
    'getTeam',
    'getFile'
  ]

  expectedExports.forEach((name) => {
    assert.strictEqual(
      typeof indexModule[name],
      'function',
      `Should export ${name} function`
    )
  })
})

test('index exports - validates parameter requirements', async () => {
  const { upcomingEvents } = await import('../src/index.js')

  await assert.rejects(
    upcomingEvents(null, 'repo'),
    /Missing required parameters/
  )
  await assert.rejects(
    upcomingEvents('org', null),
    /Missing required parameters/
  )
})

test(
  'upcomingEvents - real API call',
  { skip: !process.env.GH_PAT && !process.env.GH_PRIVATE_KEY },
  async () => {
    const { upcomingEvents } = await import('../src/index.js')
    const results = await upcomingEvents('boulder-js', 'events')

    assert.ok(Array.isArray(results))
    if (results.length === 0) return

    const event = results[0]
    const expectedFields = [
      'title',
      'number',
      'url',
      'date',
      'facets',
      'talks',
      'reactions'
    ]
    expectedFields.forEach((field) => assert.ok(field in event))
    assert.ok(Array.isArray(event.talks))
    assert.ok(Array.isArray(event.reactions))

    if (event.talks.length > 0) {
      const talk = event.talks[0]
      assert.ok('author' in talk && talk.title)
    }
  }
)
