import { parseGql } from './lib/parseGql.js'
import { validateParams } from './lib/validateParams.js'

function processTeamPayload(teamData) {
  if (!teamData) {
    return null
  }

  const { name, slug, description, members } = teamData

  return {
    name,
    slug,
    description: description || null,
    members:
      members?.nodes?.map((member) => ({
        login: member.login,
        name: member.name || null,
        avatarUrl: member.avatarUrl,
        bio: member.bio || null,
        websiteUrl: member.websiteUrl || null,
        company: member.company || null,
        location: member.location || null,
        socialAccounts:
          member.socialAccounts?.nodes?.map((account) => ({
            provider: account.provider,
            url: account.url
          })) || []
      })) || []
  }
}

export async function getTeamById(graphql, org, teamSlug) {
  validateParams({ graphql, org, teamSlug })

  try {
    const query = await parseGql('team')
    const vars = {
      organization: org,
      teamSlug
    }

    const result = await graphql(query, vars)
    return processTeamPayload(result.organization?.team)
  } catch (error) {
    throw new Error(`Failed to fetch team ${teamSlug}: ${error.message}`)
  }
}
