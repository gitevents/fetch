import { defaultApprovedEventLabel } from '../config.js'
import eventsQuery from '../graphql/events.gql?raw'
import eventQuery from '../graphql/event.gql?raw'
import teamQuery from '../graphql/team.gql?raw'

const queries = {
  events: eventsQuery,
  event: eventQuery,
  team: teamQuery
}

export async function parseGql(path) {
  const query = queries[path]

  if (!query) {
    throw new Error(`Unknown GraphQL query: ${path}`)
  }

  const result = query.replace('DEFAULT_LABEL', defaultApprovedEventLabel)

  return result
}
