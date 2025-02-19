import bodyParser from '@zentered/issue-forms-body-parser'

export async function processEventsPayload(eventIssues) {
  const events = []

  for (const edge of eventIssues) {
    const { node: eventIssue } = edge
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

  const sortedByDate = events
    .sort((a, b) => {
      return new Date(a.facets.date) - new Date(b.facets.date)
    })
    .reverse()

  return sortedByDate
}
