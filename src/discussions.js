import { parseGql } from './lib/parseGql.js'

function validateParams(params) {
  const missing = []
  for (const [key, value] of Object.entries(params)) {
    if (!value) missing.push(key)
  }
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`)
  }
}

function processDiscussionsPayload(edges) {
  if (!edges || edges.length === 0) {
    return []
  }

  return edges.map((edge) => {
    const node = edge?.node || edge

    return {
      id: node.id || null,
      number: node.number || null,
      title: node.title || null,
      url: node.url || null,
      body: node.body || null,
      createdAt: node.createdAt ? new Date(node.createdAt) : null,
      updatedAt: node.updatedAt ? new Date(node.updatedAt) : null,
      author: node.author
        ? {
            login: node.author.login || null,
            name: node.author.name || null,
            avatarUrl: node.author.avatarUrl || null,
            url: node.author.url || null
          }
        : null,
      category: node.category
        ? {
            id: node.category.id || null,
            name: node.category.name || null,
            emoji: node.category.emoji || null,
            description: node.category.description || null
          }
        : null,
      reactions: node.reactions?.nodes?.map((r) => r.content) || [],
      commentCount: node.comments?.totalCount || 0
    }
  })
}

export async function listDiscussions(graphql, org, repo, options = {}) {
  validateParams({ graphql, org, repo })

  try {
    const query = await parseGql('discussions')
    const vars = {
      organization: org,
      repository: repo,
      first: options.first || 10,
      categoryId: options.categoryId || null
    }

    const result = await graphql(query, vars)
    return processDiscussionsPayload(result.repository.discussions.edges)
  } catch (error) {
    throw new Error(`Failed to fetch discussions: ${error.message}`)
  }
}
