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

    const orgData = result.organization

    return {
      name: orgData.name || null,
      login: orgData.login || null,
      description: orgData.description || null,
      websiteUrl: orgData.websiteUrl || null,
      avatarUrl: orgData.avatarUrl || null,
      email: orgData.email || null,
      location: orgData.location || null,
      createdAt: orgData.createdAt ? new Date(orgData.createdAt) : null,
      updatedAt: orgData.updatedAt ? new Date(orgData.updatedAt) : null,
      memberCount: orgData.membersWithRole?.totalCount || 0,
      publicRepoCount: orgData.repositories?.totalCount || 0
    }
  } catch (error) {
    throw new Error(`Failed to fetch organization: ${error.message}`)
  }
}
