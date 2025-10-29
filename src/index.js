import { createAppAuth } from '@octokit/auth-app'
import { createTokenAuth } from '@octokit/auth-token'
import { graphql } from '@octokit/graphql'
import { ghAppId, ghAppInstallationId, ghPrivateKey, ghPAT } from './config.js'
import { listUpcomingEvents, listPastEvents, getEvent } from './events.js'
import { getTeamById } from './teams.js'
import { getLocations as fetchLocations } from './locations.js'
import { getUser as getUserProfile } from './users.js'
import { getFile as getFileContent } from './files.js'

function createAuth() {
  // Use PAT if provided (and no private key)
  if (ghPAT && !ghPrivateKey) {
    console.log('Using GitHub PAT for authentication')
    return createTokenAuth(ghPAT)
  }

  // Use GitHub App authentication
  if (!ghAppId || !ghPrivateKey || !ghAppInstallationId) {
    throw new Error(
      'Missing GitHub App credentials. Set GH_APP_ID, GH_PRIVATE_KEY, and GH_APP_INSTALLATION_ID environment variables, or provide GH_PAT for token authentication.'
    )
  }

  try {
    return createAppAuth({
      appId: ghAppId,
      privateKey: Buffer.from(ghPrivateKey, 'base64').toString('ascii'),
      installationId: ghAppInstallationId
    })
  } catch (error) {
    throw new Error(
      `Failed to create GitHub App authentication: ${error.message}. Ensure GH_PRIVATE_KEY is base64-encoded.`
    )
  }
}

let graphqlWithAuth = null

function getGraphqlClient() {
  if (!graphqlWithAuth) {
    const auth = createAuth()
    graphqlWithAuth = graphql.defaults({
      request: {
        hook: auth.hook
      }
    })
  }
  return graphqlWithAuth
}

export async function upcomingEvents(org, repo) {
  // Validate parameters before creating auth
  if (!org || !repo) {
    throw new Error('Missing required parameters: org and repo are required')
  }
  return listUpcomingEvents(getGraphqlClient(), org, repo)
}

export async function pastEvents(org, repo) {
  // Validate parameters before creating auth
  if (!org || !repo) {
    throw new Error('Missing required parameters: org and repo are required')
  }
  return listPastEvents(getGraphqlClient(), org, repo)
}

export async function event(org, repo, number) {
  // Validate parameters before creating auth
  if (!org || !repo || number === undefined || number === null) {
    throw new Error(
      'Missing required parameters: org, repo, and number are required'
    )
  }
  return getEvent(getGraphqlClient(), org, repo, number)
}

export async function getTeam(org, teamSlug) {
  // Validate parameters before creating auth
  if (!org || !teamSlug) {
    throw new Error(
      'Missing required parameters: org and teamSlug are required'
    )
  }
  return getTeamById(getGraphqlClient(), org, teamSlug)
}

export async function getFile(org, repo, filePath, options) {
  // Validate parameters before creating auth
  if (!org || !repo || !filePath) {
    throw new Error(
      'Missing required parameters: org, repo, and filePath are required'
    )
  }
  return getFileContent(getGraphqlClient(), org, repo, filePath, options)
}

export async function getUser(login) {
  // Validate parameters before creating auth
  if (!login) {
    throw new Error('Missing required parameters: login is required')
  }
  return getUserProfile(getGraphqlClient(), login)
}

export async function getLocations(org, repo, options) {
  // Validate parameters before creating auth
  if (!org || !repo) {
    throw new Error('Missing required parameters: org and repo are required')
  }
  return fetchLocations(getGraphqlClient(), org, repo, options)
}
