import { IncomingMessage, ServerResponse } from 'http'
import { send } from 'micro'
import { ApiContext } from '../../api'
import { ensureJsonData } from '../../middlewares/json'
import { ensureLoggedIn, hasRole, ensureRole, ensureSelf } from '../user'
import {
  GenericAction,
  GenericActions,
  GenericActionUtilities,
  GenericActionContext,
  GenericActionClientContext,
  ContentTypeAction,
  ContentTypeActionClientContext
} from './schema'

export * from './schema'

const createClientActionUtilities = (req: IncomingMessage, res: ServerResponse): GenericActionUtilities => ({
  actionError: (error) => send(res, error.status || 500, error),
  ensureLoggedIn: () => ensureLoggedIn(req, res),
  hasRole: (role) => hasRole(req, res, role),
  ensureRole: (role, sendError) => ensureRole(req, res, role, sendError),
  ensureSelf: (data, sendError) => ensureSelf(req, res, data, sendError),
  ensureSelfOrRole: (data, role) => {
    if (hasRole(req, res, role)) return true
    if (ensureSelf(req, res, data, false)) return true
    return ensureRole(req, res, role)
  }
})

export const serverActionUtilities: GenericActionUtilities = {
  actionError: (error) => { throw error },
  ensureLoggedIn: () => true,
  hasRole: () => true,
  ensureRole: () => true,
  ensureSelf: () => true,
  ensureSelfOrRole: () => true
}

export const provideAction = (apiContext: ApiContext, serverActions: GenericActions) => {

  const {
    auth,
    contentTypes,
    actions
  } = apiContext

  return async (req, res) => {

    if (!ensureJsonData(req, res)) return

    const { route, user } = req
    const { type = 'action', action, data } = req.data

    // Generic action

    const genericActionContext: GenericActionClientContext = {
      auth,
      contentTypes,
      actions: serverActions,

      // Distinguish from actions called by server directly
      isClient: true,
      route,
      user,
      ...createClientActionUtilities(req, res),
    }

    const { actionError } = genericActionContext

    if (type === 'action') {

      const fn = actions[action] as GenericAction
      if (!fn) return actionError({ status: 404, message: `Action "${action}" not found` })

      try {
        const result = await fn(data, genericActionContext)
        if (!res.headersSent) return send(res, 200, result)
        return
      } catch(e) {
        return actionError({ status: 500, message: `Action "${action}" error`, error: e.message })
      }
    }

    // Content type action

    const contentType = contentTypes[type]
    const fn = contentType[action] as ContentTypeAction

    if (action === 'db') return actionError({
      status: 401,
      message: `Forbidden`
    })
    if (!contentType) return actionError({
      status: 404,
      message: `Content type "${type}" not found`
    })
    if (!fn) return actionError({
      status: 404,
      message: `Action "${action}" not found for content type "${type}"`
    })

    const contentTypeActionContext: ContentTypeActionClientContext = {
      ...genericActionContext,
      db: contentType.db,
      contentType
    }

    try {
      const result = await fn(data, contentTypeActionContext)
      if (!res.headersSent) return send(res, 200, result)
      return
    } catch(e) {
      return  actionError({
        status: 500,
        message: `Content type "${type}" action "${action}" error`,
        error: e.message
      })
    }
  }
}

export const createActions = (apiContext: ApiContext) => {

  const {
    actions
  } = apiContext

  // Create server-side actions

  const serverActionContext: GenericActionContext  = {
    ...apiContext,
    ...serverActionUtilities
  }

  const serverActions: GenericActions = Object.keys(actions).reduce((obj, key) => {
    obj[key] = data => actions[key](data, {
      ...serverActionContext,
      actions: serverActions
    })
    return obj
  }, {})

  return {
    serverActions,
    actionHandler: provideAction(
      apiContext,
      serverActions
    )
  }
}
