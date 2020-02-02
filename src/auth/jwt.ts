import { RequestHandler } from '../server'

export const provideJwtToken = (auth): RequestHandler => async (req, res) => {

  const prefix = 'Bearer '
  const bearerToken =
    (req.headers.authorization && req.headers.authorization.slice(0, prefix.length)===prefix)
      ? req.headers.authorization.replace(prefix, '')
      : ''

  if (!bearerToken) {
    req.jwtError = {
      message: 'Missing Authorization header'
    }
    return
  }

  try {

    req.jwt = await auth.decodeToken(bearerToken)

    if (!req.jwt) {
      delete req.jwt
      req.jwtError = {
        message: 'Invalid token'
      }
    }
    // decodeToken throws when expired
    /* else if (auth.isTokenExpired(req.jwt)) {
      delete req.jwt
      req.jwtError = {
        message: 'Expired token'
      }
    }*/

  } catch (e) {
    req.jwtError = {
      message: e.message || 'Invalid token'
    }
  }
}
