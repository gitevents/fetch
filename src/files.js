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

export async function getFile(graphql, org, repo, filePath, options = {}) {
  validateParams({ graphql, org, repo, filePath })

  try {
    const query = await parseGql('file')
    const branch = options.branch || 'HEAD'
    const expression = `${branch}:${filePath}`

    const vars = {
      organization: org,
      repository: repo,
      expression
    }

    const result = await graphql(query, vars)

    if (!result.repository?.object) {
      throw new Error(`File not found: ${filePath}`)
    }

    const file = result.repository.object

    if (file.isBinary) {
      throw new Error(`Binary files are not supported: ${filePath}`)
    }

    const content = file.text

    // Auto-parse JSON if requested
    if (options.parse) {
      try {
        return JSON.parse(content)
      } catch (error) {
        throw new Error(
          `Failed to parse JSON from ${filePath}: ${error.message}`
        )
      }
    }

    return content
  } catch (error) {
    // If it's already one of our custom errors, re-throw it
    if (
      error.message.includes('File not found') ||
      error.message.includes('Binary files are not supported') ||
      error.message.includes('Failed to parse JSON')
    ) {
      throw error
    }
    throw new Error(`Failed to fetch file: ${error.message}`)
  }
}
