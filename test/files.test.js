import test from 'node:test'
import assert from 'node:assert'
import { getFile } from '../src/files.js'

test('getFile - validates required parameters', async () => {
  await assert.rejects(
    async () => {
      await getFile(null, 'org', 'repo', 'file.txt')
    },
    {
      message: /Missing required parameters/
    },
    'Should validate graphql parameter'
  )

  await assert.rejects(
    async () => {
      const mockGraphql = () => {}
      await getFile(mockGraphql, null, 'repo', 'file.txt')
    },
    {
      message: /Missing required parameters/
    },
    'Should validate org parameter'
  )

  await assert.rejects(
    async () => {
      const mockGraphql = () => {}
      await getFile(mockGraphql, 'org', null, 'file.txt')
    },
    {
      message: /Missing required parameters/
    },
    'Should validate repo parameter'
  )

  await assert.rejects(
    async () => {
      const mockGraphql = () => {}
      await getFile(mockGraphql, 'org', 'repo', null)
    },
    {
      message: /Missing required parameters/
    },
    'Should validate filePath parameter'
  )
})

test('getFile - fetches text file successfully', async () => {
  const mockGraphql = async () => ({
    repository: {
      object: {
        text: 'This is the content of the file',
        byteSize: 32,
        isBinary: false
      }
    }
  })

  const result = await getFile(mockGraphql, 'org', 'repo', 'README.md')

  assert.equal(result, 'This is the content of the file')
})

test('getFile - parses JSON when requested', async () => {
  const mockGraphql = async () => ({
    repository: {
      object: {
        text: '{"name":"test","value":123}',
        byteSize: 25,
        isBinary: false
      }
    }
  })

  const result = await getFile(mockGraphql, 'org', 'repo', 'data.json', {
    parse: true
  })

  assert.deepEqual(result, { name: 'test', value: 123 })
})

test('getFile - handles file not found', async () => {
  const mockGraphql = async () => ({
    repository: {
      object: null
    }
  })

  await assert.rejects(
    async () => {
      await getFile(mockGraphql, 'org', 'repo', 'missing.txt')
    },
    {
      message: /File not found: missing.txt/
    },
    'Should throw file not found error'
  )
})

test('getFile - handles binary files', async () => {
  const mockGraphql = async () => ({
    repository: {
      object: {
        text: null,
        byteSize: 1024,
        isBinary: true
      }
    }
  })

  await assert.rejects(
    async () => {
      await getFile(mockGraphql, 'org', 'repo', 'image.png')
    },
    {
      message: /Binary files are not supported: image.png/
    },
    'Should throw binary file error'
  )
})

test('getFile - handles invalid JSON', async () => {
  const mockGraphql = async () => ({
    repository: {
      object: {
        text: '{invalid json}',
        byteSize: 14,
        isBinary: false
      }
    }
  })

  await assert.rejects(
    async () => {
      await getFile(mockGraphql, 'org', 'repo', 'data.json', { parse: true })
    },
    {
      message: /Failed to parse JSON from data.json/
    },
    'Should throw JSON parse error'
  )
})

test('getFile - uses default branch HEAD', async () => {
  const mockGraphql = async (query, vars) => {
    assert.equal(
      vars.expression,
      'HEAD:README.md',
      'Should use HEAD as default branch'
    )
    return {
      repository: {
        object: {
          text: 'content',
          byteSize: 7,
          isBinary: false
        }
      }
    }
  }

  await getFile(mockGraphql, 'org', 'repo', 'README.md')
})

test('getFile - uses custom branch', async () => {
  const mockGraphql = async (query, vars) => {
    assert.equal(
      vars.expression,
      'develop:README.md',
      'Should use custom branch'
    )
    return {
      repository: {
        object: {
          text: 'content',
          byteSize: 7,
          isBinary: false
        }
      }
    }
  }

  await getFile(mockGraphql, 'org', 'repo', 'README.md', { branch: 'develop' })
})

test('getFile - handles GraphQL errors', async () => {
  const mockGraphql = async () => {
    throw new Error('API rate limit exceeded')
  }

  await assert.rejects(
    async () => {
      await getFile(mockGraphql, 'org', 'repo', 'file.txt')
    },
    {
      message: /Failed to fetch file: API rate limit exceeded/
    },
    'Should wrap GraphQL errors'
  )
})

// Integration test with real API
test(
  'getFile - real API call',
  {
    skip: !process.env.GH_PAT && !process.env.GH_PRIVATE_KEY
  },
  async () => {
    const { getFile: getFileAPI } = await import('../src/index.js')

    // Fetch README from this repository
    const readme = await getFileAPI('gitevents', 'fetch', 'README.md')

    assert.ok(typeof readme === 'string', 'Should return string content')
    assert.ok(readme.length > 0, 'Should have content')
    assert.ok(readme.includes('GitEvents'), 'Should contain expected content')
  }
)

// Integration test with JSON parsing
test(
  'getFile - real API call with JSON parsing',
  {
    skip: !process.env.GH_PAT && !process.env.GH_PRIVATE_KEY
  },
  async () => {
    const { getFile: getFileAPI } = await import('../src/index.js')

    // Fetch package.json from this repository
    const packageJson = await getFileAPI('gitevents', 'fetch', 'package.json', {
      parse: true
    })

    assert.ok(typeof packageJson === 'object', 'Should return parsed object')
    assert.equal(
      packageJson.name,
      'gitevents-fetch',
      'Should have correct package name'
    )
    assert.ok(packageJson.version, 'Should have version field')
  }
)
