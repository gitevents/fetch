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

export async function getOrganization(graphql, org) {
  validateParams({ graphql, org })

  try {
    const query = await parseGql('organization')
    const vars = {
      organization: org
    }

    const result = await graphql(query, vars)

    if (!result.organization) {
      return null
    }

    const org = result.organization

    return {
      name: org.name || null,
      login: org.login || null,
      description: org.description || null,
      websiteUrl: org.websiteUrl || null,
      avatarUrl: org.avatarUrl || null,
      email: org.email || null,
      location: org.location || null,
      createdAt: org.createdAt ? new Date(org.createdAt) : null,
      updatedAt: org.updatedAt ? new Date(org.updatedAt) : null,
      memberCount: org.membersWithRole?.totalCount || 0,
      publicRepoCount: org.repositories?.totalCount || 0
    }
  } catch (error) {
    throw new Error(`Failed to fetch organization: ${error.message}`)
  }
}
