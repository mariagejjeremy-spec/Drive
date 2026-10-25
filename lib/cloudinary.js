import cloudinary from 'cloudinary'

const client = cloudinary.v2

export const CLOUDINARY_CONFIGURATION_CODE = 'CLOUDINARY_CONFIGURATION'
export const CLOUDINARY_CONFIGURATION_MESSAGE =
  'La configuration Cloudinary est invalide. Vérifiez le Cloud name et que les clés API appartiennent au même compte.'

export function getCloudinary() {
  let urlConfig = {}
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim()

  if (cloudinaryUrl) {
    try {
      const parsedUrl = new URL(cloudinaryUrl)
      if (parsedUrl.protocol === 'cloudinary:') {
        urlConfig = {
          cloud_name: parsedUrl.hostname,
          api_key: decodeURIComponent(parsedUrl.username),
          api_secret: decodeURIComponent(parsedUrl.password),
        }
      }
    } catch {
      urlConfig = {}
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || urlConfig.cloud_name
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || urlConfig.api_key
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || urlConfig.api_secret

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

function getCloudinaryHttpCode(error) {
  const httpCode = error?.http_code ?? error?.error?.http_code
  return Number.isInteger(httpCode) ? httpCode : undefined
}

function isCloudinaryConfigurationError(error) {
  const message = typeof error?.error?.message === 'string' ? error.error.message : ''
  return (
    error?.code === CLOUDINARY_CONFIGURATION_CODE ||
    getCloudinaryHttpCode(error) === 401 ||
    /unknown api[_ ]key|api[_ ]key|cloud[_ ]name|invalid signature/i.test(message)
  )
}

export function logSanitizedCloudinaryError(operation, error) {
  console.error(`[${operation}] request failed`, {
    code: error?.code === CLOUDINARY_CONFIGURATION_CODE ? error.code : undefined,
    httpCode: getCloudinaryHttpCode(error),
  })
}

export function createCloudinaryErrorResponse(error, fallbackMessage) {
  if (isCloudinaryConfigurationError(error)) {
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
