import { defaultApprovedEventLabel } from '../config.js'
import eventsQuery from '../graphql/events.js'
import eventQuery from '../graphql/event.js'
import teamQuery from '../graphql/team.js'
import discussionsQuery from '../graphql/discussions.js'
import organizationQuery from '../graphql/organization.js'
import userQuery from '../graphql/user.js'
import fileQuery from '../graphql/file.js'

const queries = {
  events: eventsQuery,
  event: eventQuery,
  team: teamQuery,
  discussions: discussionsQuery,
  organization: organizationQuery,
  user: userQuery,
  file: fileQuery
}

export async function parseGql(path) {
  const query = queries[path]

  if (!query) {
    throw new Error(`Unknown GraphQL query: ${path}`)
  }

  const result = query.replace('DEFAULT_LABEL', defaultApprovedEventLabel)

  return result
}
