import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defaultApprovedEventLabel } from '../config.js'

export async function parseGql(path) {
  const query = await readFile(
    join(import.meta.dirname, '../graphql', `${path}.gql`),
    'utf8'
  )

  const result = query.replace('DEFAULT_LABEL', defaultApprovedEventLabel)

  return result
}
