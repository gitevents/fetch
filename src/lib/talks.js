import { ghOrg, ghRepo } from '../config.js'
import { parseGql } from './parseGql.js'
import { processEventsPayload } from './processEventsPayload.js'

export async function listTalks(graphql) {
  const query = await parseGql('talks')
  const vars = {
    organization: ghOrg,
    repository: ghRepo,
    state: 'OPEN',
    first: 10
  }

  const result = await graphql(query, vars)

  return processEventsPayload(result.repository.issues.nodes)
}
