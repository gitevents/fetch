import { parseGql } from './lib/parseGql.js'
import { processEventsPayload } from './lib/processEventsPayload.js'

export async function listUpcomingEvents(
  graphql,
  org,
  repo,
  pagination = { first: 10 }
) {
  const query = await parseGql('events')
  const vars = {
    organization: org,
    repository: repo,
    state: 'OPEN',
    first: pagination.first
  }

  const result = await graphql(query, vars)
  return processEventsPayload(result.repository.issues.edges)
}

export async function listPastEvents(
  graphql,
  org,
  repo,
  pagination = { first: 10 }
) {
  const query = await parseGql('events')
  const vars = {
    organization: org,
    repository: repo,
    state: 'CLOSED',
    first: pagination.first
  }

  const result = await graphql(query, vars)
  return processEventsPayload(result.repository.issues.nodes)
}

export async function getEvent(graphql, org, repo, number) {
  const query = await parseGql('event')
  const vars = {
    organization: org,
    repository: repo,
    number
  }

  const result = await graphql(query, vars)
  return processEventsPayload([result.repository.issue])
}
