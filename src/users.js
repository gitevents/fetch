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

export async function getUser(graphql, login) {
  validateParams({ graphql, login })

  try {
    const query = await parseGql('user')
    const vars = {
      login
    }

    const result = await graphql(query, vars)

    if (!result.user) {
      return null
    }

    const user = result.user

    return {
      login: user.login || null,
      name: user.name || null,
      bio: user.bio || null,
      avatarUrl: user.avatarUrl || null,
      url: user.url || null,
      websiteUrl: user.websiteUrl || null,
      company: user.company || null,
      location: user.location || null,
      email: user.email || null,
      createdAt: user.createdAt ? new Date(user.createdAt) : null,
      updatedAt: user.updatedAt ? new Date(user.updatedAt) : null,
      followerCount: user.followers?.totalCount || 0,
      followingCount: user.following?.totalCount || 0,
      publicRepoCount: user.repositories?.totalCount || 0,
      socialAccounts:
        user.socialAccounts?.nodes?.map((account) => ({
          provider: account.provider || null,
          url: account.url || null
        })) || []
    }
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }
}
