import { parseGql } from './lib/parseGql.js'
import { validateParams } from './lib/validateParams.js'

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
          provider: account.provider,
          url: account.url
        })) || []
    }
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }
}
