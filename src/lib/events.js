import { ghOrg, ghRepo } from '../config.js'
import { parseGql } from './parseGql.js'
import bodyParser from '@zentered/issue-forms-body-parser'

export async function listUpcomingEvents(graphql) {
  const query = await parseGql('events')
  const vars = {
    organization: ghOrg,
    repository: ghRepo,
    state: 'OPEN',
    first: 10
  }

  const result = await graphql(query, vars)

  const events = []
  for (const eventIssue of result.repository.issues.nodes) {
    const { title, url, body, number, reactions, subIssues } = eventIssue
    const parsedBody = await bodyParser(body)
    const event = {
      title,
      number,
      url,
      body,
      facets: parsedBody,
      talks: [],
      reactions: []
    }

    for (const reaction of reactions.nodes) {
      const { content } = reaction
      event.reactions.push(content)
    }

    for (const subIssue of subIssues.nodes) {
      const { title, url, body, reactions } = subIssue
      const parsedBody = await bodyParser(body)
      const talk = {
        title,
        url,
        body,
        reactions: [],
        facets: parsedBody
      }

      for (const reaction of reactions.nodes) {
        const { content } = reaction
        talk.reactions.push(content)
      }

      event.talks.push(talk)
    }

    events.push(event)
  }

  console.log(JSON.stringify(events, null, 2))
}
