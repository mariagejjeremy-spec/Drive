import cloudinary from 'cloudinary'

const client = cloudinary.v2

export const CLOUDINARY_CONFIGURATION_CODE = 'CLOUDINARY_CONFIGURATION'
export const CLOUDINARY_CONFIGURATION_MESSAGE =
  'La configuration Cloudinary est invalide. Vérifiez CLOUDINARY_URL et le Cloud name du compte.'

function createConfigurationError() {
  const error = new Error('Invalid Cloudinary configuration')
  error.code = CLOUDINARY_CONFIGURATION_CODE
  return error
}

export function getCloudinary() {
  const cloudinaryUrl =
    process.env.CLOUDINARY_URL?.trim() || process.env.CLOUDINARY_URL_2?.trim()

  if (cloudinaryUrl) {
    try {
      const parsedUrl = new URL(cloudinaryUrl)
      const cloudName = parsedUrl.hostname
      const apiKey = decodeURIComponent(parsedUrl.username)
      const apiSecret = decodeURIComponent(parsedUrl.password)

      if (parsedUrl.protocol !== 'cloudinary:' || !cloudName || !apiKey || !apiSecret) {
        throw createConfigurationError()
      }

      client.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      })

      return client
    } catch {
      throw createConfigurationError()
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()

  if (!cloudName || !apiKey || !apiSecret || cloudName === apiKey) {
    throw createConfigurationError()
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
  const message =
    typeof error?.error?.message === 'string'
      ? error.error.message
      : typeof error?.message === 'string' ? error.message : ''
  return (
    error?.code === CLOUDINARY_CONFIGURATION_CODE ||
    [401, 404].includes(getCloudinaryHttpCode(error)) ||
    /unknown api[_ ]key|api[_ ]key|cloud[_ ]name|invalid signature|status code 404/i.test(message)
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
