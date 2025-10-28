import { parseGql } from './lib/parseGql.js'
import { processEventsPayload } from './lib/processEventsPayload.js'

function validateParams(params) {
  const missing = []
  for (const [key, value] of Object.entries(params)) {
    if (!value) missing.push(key)
  }
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`)
  }
}

export async function listUpcomingEvents(
  graphql,
  org,
  repo,
  pagination = { first: 10 }
) {
  validateParams({ graphql, org, repo })

  try {
    const query = await parseGql('events')
    const vars = {
      organization: org,
      repository: repo,
      state: 'OPEN',
      first: pagination.first
    }

    const result = await graphql(query, vars)
    return processEventsPayload(result.repository.issues.edges)
  } catch (error) {
    throw new Error(`Failed to fetch upcoming events: ${error.message}`)
  }
}

export async function listPastEvents(
  graphql,
  org,
  repo,
  pagination = { first: 10 }
) {
  validateParams({ graphql, org, repo })

  try {
    const query = await parseGql('events')
    const vars = {
      organization: org,
      repository: repo,
      state: 'CLOSED',
      first: pagination.first
    }

    const result = await graphql(query, vars)
    return processEventsPayload(result.repository.issues.edges)
  } catch (error) {
    throw new Error(`Failed to fetch past events: ${error.message}`)
  }
}

export async function getEvent(graphql, org, repo, number) {
  validateParams({ graphql, org, repo, number })

  try {
    const query = await parseGql('event')
    const vars = {
      organization: org,
      repository: repo,
      number
    }

    const result = await graphql(query, vars)
    return processEventsPayload([result.repository.issue])
  } catch (error) {
    throw new Error(`Failed to fetch event #${number}: ${error.message}`)
  }
}
