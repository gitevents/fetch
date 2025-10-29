import { parseGql } from './lib/parseGql.js'
import { processEventsPayload } from './lib/processEventsPayload.js'
import { validateParams } from './lib/validateParams.js'

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
