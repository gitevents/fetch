import bodyParser from '@zentered/issue-forms-body-parser'

export async function processEventsPayload(eventIssues) {
  const events = []

  for (const edge of eventIssues) {
    // Handle both edges structure ({ node: ... }) and direct nodes
    const eventIssue = edge.node || edge
    const { title, url, body, number, reactions, subIssues } = eventIssue
    const parsedBody = await bodyParser(body)

    // Extract date from facets for convenience
    // The date field is nested: facets.date.date contains the ISO date string
    const eventDate = parsedBody?.date?.date
      ? new Date(parsedBody.date.date)
      : null

    const event = {
      title,
      number,
      url,
      body,
      date: eventDate,
      facets: parsedBody,
      talks: [],
      reactions: []
    }

    // Safely iterate reactions (may be null/undefined)
    if (reactions?.nodes) {
      for (const reaction of reactions.nodes) {
        const { content } = reaction
        event.reactions.push(content)
      }
    }

    // Safely iterate subIssues (may be null/undefined)
    if (subIssues?.nodes) {
      for (const subIssue of subIssues.nodes) {
        const { title, url, body, reactions, author } = subIssue
        const parsedBody = await bodyParser(body)
        const talk = {
          title,
          url,
          body,
          author: author || null,
          reactions: [],
          facets: parsedBody
        }

        // Safely iterate talk reactions
        if (reactions?.nodes) {
          for (const reaction of reactions.nodes) {
            const { content } = reaction
            talk.reactions.push(content)
          }
        }

        event.talks.push(talk)
      }
    }

    events.push(event)
  }

  // Sort by date (most recent first), events without dates go to the end
  return events.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date - a.date
  })
}
