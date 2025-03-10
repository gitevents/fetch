import { createAppAuth } from '@octokit/auth-app'
import { graphql } from '@octokit/graphql'
import { ghAppId, ghAppInstallationId, ghPrivateKey } from './config.js'
import { listUpcomingEvents } from './events.js'

const auth = createAppAuth({
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
