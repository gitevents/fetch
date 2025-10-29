export function validateParams(params) {
  const missing = []
  for (const [key, value] of Object.entries(params)) {
    if (!value) missing.push(key)
  }
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`)
  }
}
