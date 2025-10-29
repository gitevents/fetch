import test from 'node:test'
import assert from 'node:assert'
import { getLocations } from '../src/locations.js'

// Mock graphql function for file fetching
const createMockGraphql = (fileContent) => {
  return async (query, vars) => {
    // Simulate file fetching
    if (vars.expression.includes('locations.json')) {
      return {
        repository: {
          object: {
            text: JSON.stringify(fileContent),
            byteSize: 100,
            isBinary: false
          }
        }
      }
    }
    throw new Error('File not found')
  }
}

test('getLocations - validates required parameters', async () => {
  await assert.rejects(
    async () => {
      await getLocations(null, 'repo')
    },
    {
      message: /Missing required parameters/
    },
    'Should validate graphql parameter'
  )

  await assert.rejects(
    async () => {
      const mockGraphql = () => {}
      await getLocations(mockGraphql, null, 'repo')
    },
    {
      message: /Missing required parameters/
    },
    'Should validate org parameter'
  )

  await assert.rejects(
    async () => {
      const mockGraphql = () => {}
      await getLocations(mockGraphql, 'org', null)
    },
    {
      message: /Missing required parameters/
    },
    'Should validate repo parameter'
  )
})

test('getLocations - fetches and validates locations successfully', async () => {
  const locationsData = [
    {
      id: 'venue-1',
      name: 'Tech Hub',
      address: '123 Main St, City',
      coordinates: {
        lat: 40.7128,
        lng: -74.006
      },
      url: 'https://techhub.com',
      what3words: 'filled.count.soap',
      description: 'A modern tech venue',
      capacity: 100,
      accessibility: 'Wheelchair accessible'
    }
  ]

  const mockGraphql = createMockGraphql(locationsData)
  const result = await getLocations(mockGraphql, 'org', 'repo')

  assert.equal(result.locations.length, 1)
  assert.equal(result.errors, null)

  const location = result.locations[0]
  assert.equal(location.id, 'venue-1')
  assert.equal(location.name, 'Tech Hub')
  assert.equal(location.address, '123 Main St, City')
  assert.equal(location.coordinates.lat, 40.7128)
  assert.equal(location.coordinates.lng, -74.006)
  assert.equal(location.url, 'https://techhub.com')
  assert.equal(location.what3words, 'filled.count.soap')
  assert.equal(location.description, 'A modern tech venue')
  assert.equal(location.capacity, 100)
  assert.equal(location.accessibility, 'Wheelchair accessible')
})

test('getLocations - handles minimal location data', async () => {
  const locationsData = [
    {
      id: 'venue-1',
      name: 'Simple Venue'
    }
  ]

  const mockGraphql = createMockGraphql(locationsData)
  const result = await getLocations(mockGraphql, 'org', 'repo')

  assert.equal(result.locations.length, 1)
  assert.equal(result.errors, null)

  const location = result.locations[0]
  assert.equal(location.id, 'venue-1')
  assert.equal(location.name, 'Simple Venue')
  assert.equal(location.address, null)
  assert.equal(location.coordinates, null)
  assert.equal(location.url, null)
})

test('getLocations - includes validation errors for invalid data', async () => {
  const locationsData = [
    {
      id: 'venue-1',
      name: 'Valid Venue'
    },
    {
      name: 'Missing ID'
    },
    {
      id: 123,
      name: 'Invalid ID Type'
    },
    {
      id: 'venue-4',
      name: 'Bad Coords',
      coordinates: {
        lat: 'not-a-number',
        lng: -74.006
      }
    }
  ]

  const mockGraphql = createMockGraphql(locationsData)
  const result = await getLocations(mockGraphql, 'org', 'repo')

  assert.equal(result.locations.length, 1) // Only valid venue
  assert.ok(result.errors) // Has validation errors
  assert.equal(result.errors.length, 3) // Three invalid locations

  assert.equal(result.errors[0].index, 1)
  assert.ok(result.errors[0].errors[0].includes('id'))

  assert.equal(result.errors[1].index, 2)
  assert.ok(result.errors[1].errors[0].includes('id'))

  assert.equal(result.errors[2].index, 3)
  assert.ok(result.errors[2].errors[0].includes('coordinates'))
})

test('getLocations - validates missing lat or lng in coordinates', async () => {
  const locationsData = [
    {
      id: 'venue-1',
      name: 'Missing Lat',
      coordinates: {
        lng: -74.006
      }
    },
    {
      id: 'venue-2',
      name: 'Missing Lng',
      coordinates: {
        lat: 40.7128
      }
    },
    {
      id: 'venue-3',
      name: 'Empty Coords',
      coordinates: {}
    }
  ]

  const mockGraphql = createMockGraphql(locationsData)
  const result = await getLocations(mockGraphql, 'org', 'repo')

  assert.equal(result.locations.length, 0) // No valid venues
  assert.ok(result.errors) // Has validation errors
  assert.equal(result.errors.length, 3) // All three are invalid

  // Check that all have coordinate-related errors
  assert.ok(result.errors[0].errors[0].includes('coordinates'))
  assert.ok(result.errors[1].errors[0].includes('coordinates'))
  assert.ok(result.errors[2].errors.some((e) => e.includes('coordinates')))
})

test('getLocations - handles custom fields', async () => {
  const locationsData = [
    {
      id: 'venue-1',
      name: 'Custom Venue',
      parking: true,
      wifi: 'password123',
      customField: 'custom value'
    }
  ]

  const mockGraphql = createMockGraphql(locationsData)
  const result = await getLocations(mockGraphql, 'org', 'repo')

  assert.equal(result.locations.length, 1)
  const location = result.locations[0]
  assert.equal(location.parking, true)
  assert.equal(location.wifi, 'password123')
  assert.equal(location.customField, 'custom value')
})

test('getLocations - rejects non-array data', async () => {
  const locationsData = {
    venue1: {
      id: 'venue-1',
      name: 'Venue'
    }
  }

  const mockGraphql = createMockGraphql(locationsData)

  await assert.rejects(
    async () => {
      await getLocations(mockGraphql, 'org', 'repo')
    },
    {
      message: /Locations file must contain an array/
    },
    'Should reject non-array data'
  )
})

test('getLocations - supports custom file name', async () => {
  const locationsData = [
    {
      id: 'venue-1',
      name: 'Venue'
    }
  ]

  const mockGraphql = async (query, vars) => {
    assert.ok(
      vars.expression.includes('custom-locations.json'),
      'Should use custom file name'
    )
    return {
      repository: {
        object: {
          text: JSON.stringify(locationsData),
          byteSize: 100,
          isBinary: false
        }
      }
    }
  }

  await getLocations(mockGraphql, 'org', 'repo', {
    fileName: 'custom-locations.json'
  })
})

test('getLocations - supports custom branch', async () => {
  const locationsData = [
    {
      id: 'venue-1',
      name: 'Venue'
    }
  ]

  const mockGraphql = async (query, vars) => {
    assert.ok(
      vars.expression.startsWith('develop:'),
      'Should use custom branch'
    )
    return {
      repository: {
        object: {
          text: JSON.stringify(locationsData),
          byteSize: 100,
          isBinary: false
        }
      }
    }
  }

  await getLocations(mockGraphql, 'org', 'repo', {
    branch: 'develop'
  })
})
