import { defaultApprovedEventLabel } from '../config.js'
import eventsQuery from '../graphql/events.gql?raw'
import eventQuery from '../graphql/event.gql?raw'
import teamQuery from '../graphql/team.gql?raw'
import discussionsQuery from '../graphql/discussions.gql?raw'
import organizationQuery from '../graphql/organization.gql?raw'
import userQuery from '../graphql/user.gql?raw'
import fileQuery from '../graphql/file.gql?raw'

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
