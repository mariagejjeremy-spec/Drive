import cloudinary from 'cloudinary'

const client = cloudinary.v2

export const CLOUDINARY_CONFIGURATION_CODE = 'CLOUDINARY_CONFIGURATION'
export const CLOUDINARY_CONFIGURATION_MESSAGE =
  'La configuration Cloudinary est invalide. Vérifiez le Cloud name et les clés API.'

export function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()

  if (!cloudName || !apiKey || !apiSecret || cloudName === apiKey) {
    const error = new Error('Invalid Cloudinary configuration')
    error.code = CLOUDINARY_CONFIGURATION_CODE
    throw error
  }

  client.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })

  return client
}

export function logSanitizedCloudinaryError(operation, error) {
  console.error(`[${operation}] request failed`, {
    code: error?.code === CLOUDINARY_CONFIGURATION_CODE ? error.code : undefined,
    httpCode: Number.isInteger(error?.http_code) ? error.http_code : undefined,
  })
}

export function createCloudinaryErrorResponse(error, fallbackMessage) {
  if (error?.code === CLOUDINARY_CONFIGURATION_CODE || error?.http_code === 401) {
    return {
      status: 503,
      body: {
        code: CLOUDINARY_CONFIGURATION_CODE,
        error: CLOUDINARY_CONFIGURATION_MESSAGE,
      },
    }
  }

  return {
    status: 500,
    body: { error: fallbackMessage },
  }
}
