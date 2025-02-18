import test from 'node:test'
import { upcomingEvents } from '../src/index.js'

test('upcomingEvents', async () => {
  await upcomingEvents()
})
