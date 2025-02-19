// OAuth App Credentials
export const ghAppId = process.env.GH_APP_ID
export const ghPrivateKey = process.env.GH_PRIVATE_KEY
export const ghClientSecret = process.env.GH_CLIENT_SECRET
export const ghAppInstallationId = process.env.GH_APP_INSTALLATION_ID

// GitEvents Defaults
export const defaultApprovedEventLabel =
  process.env.DEFAULT_APPROVED_EVENT_LABEL || 'Approved :white_check_mark:'
