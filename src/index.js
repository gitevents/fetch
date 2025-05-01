import { createAppAuth } from '@octokit/auth-app'
import { createTokenAuth } from '@octokit/auth-token'
import { graphql } from '@octokit/graphql'
import { ghAppId, ghAppInstallationId, ghPrivateKey, ghPAT } from './config.js'
import { listUpcomingEvents } from './events.js'

if (ghPAT && !ghPrivateKey) {
  console.log('Using GitHub PAT for authentication')
}

const auth =
  ghPAT && !ghPrivateKey
    ? createTokenAuth(ghPAT)
    : createAppAuth({
        appId: ghAppId,
        privateKey: Buffer.from(ghPrivateKey, 'base64').toString('ascii'),
        installationId: ghAppInstallationId
      })

const graphqlWithAuth = graphql.defaults({
  request: {
    hook: auth.hook
  }
})

export async function upcomingEvents(org, repo) {
  return listUpcomingEvents(graphqlWithAuth, org, repo)
}
