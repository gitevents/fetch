import { getFile } from './files.js'

function validateParams(params) {
  const missing = []
  for (const [key, value] of Object.entries(params)) {
    if (!value) missing.push(key)
  }
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`)
  }
}

function validateLocationSchema(location) {
  // Basic schema validation for location objects
  const errors = []

  if (!location.id || typeof location.id !== 'string') {
    errors.push('Location must have a string id')
  }

  if (!location.name || typeof location.name !== 'string') {
    errors.push('Location must have a string name')
  }

  // Optional fields validation
  if (location.address && typeof location.address !== 'string') {
    errors.push('Location address must be a string')
  }

  if (location.coordinates) {
    if (typeof location.coordinates !== 'object') {
      errors.push('Location coordinates must be an object')
    } else {
      if (
        !('lat' in location.coordinates) ||
        typeof location.coordinates.lat !== 'number'
      ) {
        errors.push('Location coordinates.lat must be a number')
      }
      if (
        !('lng' in location.coordinates) ||
        typeof location.coordinates.lng !== 'number'
      ) {
        errors.push('Location coordinates.lng must be a number')
      }
    }
  }

  return errors
}

export async function getLocations(graphql, org, repo, options = {}) {
  validateParams({ graphql, org, repo })

  try {
    const fileName = options.fileName || 'locations.json'
    const branch = options.branch || 'HEAD'

    // Fetch and parse the locations file
    const locationsData = await getFile(graphql, org, repo, fileName, {
      parse: true,
      branch
    })

    // Ensure it's an array
    if (!Array.isArray(locationsData)) {
      throw new Error('Locations file must contain an array of locations')
    }

    // Validate each location
    const validatedLocations = []
    const validationErrors = []

    for (let i = 0; i < locationsData.length; i++) {
      const location = locationsData[i]
      const errors = validateLocationSchema(location)

      if (errors.length > 0) {
        validationErrors.push({
          index: i,
          id: location.id || 'unknown',
          errors
        })
      } else {
        // Normalize the location object with consistent schema
        validatedLocations.push({
          id: location.id,
          name: location.name,
          address: location.address || null,
          coordinates: location.coordinates
            ? {
                lat: location.coordinates.lat,
                lng: location.coordinates.lng
              }
            : null,
          url: location.url || null,
          what3words: location.what3words || null,
          description: location.description || null,
          capacity: location.capacity || null,
          accessibility: location.accessibility || null,
          // Include any additional custom fields
          ...Object.fromEntries(
            Object.entries(location).filter(
              ([key]) =>
                ![
                  'id',
                  'name',
                  'address',
                  'coordinates',
                  'url',
                  'what3words',
                  'description',
                  'capacity',
                  'accessibility'
                ].includes(key)
            )
          )
        })
      }
    }

    // If validation errors, include them in the response
    return {
      locations: validatedLocations,
      errors: validationErrors.length > 0 ? validationErrors : null
    }
  } catch (error) {
    // Check if it's a file-related error
    if (
      error.message.includes('File not found') ||
      error.message.includes('Failed to parse JSON')
    ) {
      throw error
    }
    throw new Error(`Failed to fetch locations: ${error.message}`)
  }
}
