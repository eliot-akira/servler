import { send, json } from 'micro'

export const provideJsonData = async (req, res) => {
  try {
    req.data = await json(req)
  } catch(e) {
    // Ignore error for now - route may not require data
    req.dataError = e.message
  }
}

export const ensureJsonData = async (req, res) => {
  if (req.data) return true
  send(res, 500, { message: 'Bad request', error: req.dataError })
  return false
}
