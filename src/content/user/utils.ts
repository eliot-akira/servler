import { send } from 'micro'

export const ensureJwtToken = (req, res) => {

  // Separate error handler from auth/jwt/provideJwtToken, since not all routes require token

  if (req.jwt) return true
  send(res, 401, req.jwtError)
  return false
}

export const ensureLoggedIn = (req, res) => {

  if (!ensureJwtToken(req, res)) return false

  if (!req.user || !req.user._id) {
    send(res, 401, { message: 'Must be a logged-in user' })
    return false
  }

  return true
}

export const hasRole =  (req, res, role) => {
  const { user } = req
  if (user && user.roles && user.roles.indexOf(role) >= 0) {
    return true
  }
  return false
}

export const ensureRole = (req, res, role, sendError = true) => {
  if (hasRole(req, res, role)) return true
  if (sendError) send(res, 401, { message: `User role is not capable` })
  return false
}

export const ensureSelf = (req, res, data = {} as { _id?: string }, sendError = true) => {

  const { _id } = req.user || {}
  if (data && (data._id===_id || hasRole(req, res, 'admin'))) return true

  if (sendError) send(res, 401, { message: 'Forbidden' })
  return false
}


export const cleanUserData = (user) => {

  if (!user) return
  const {
    password, // Shouldn't exist but just in case
    hashedPassword,
    ...data
  } = user

  return data
}
