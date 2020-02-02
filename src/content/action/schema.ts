import { IncomingMessage, ServerResponse } from 'http'
import { Datastore, ContentType, ContentTypes } from '../type'
import { UserType } from '../user'
import { Auth } from '../../auth'
import { RouteContext } from '../../middlewares/route'

/**
 * There are generic actions (called via API request type="action"), and content type actions
 * that are associated with a database.
 */

export type ContentTypeActionError = {
  message?: string
}

export type ContentTypeActionResponse = ContentTypeActionError | any

export type ContentTypeActionData = {
  [key: string]: any | any[]
}

export type CommonActionContextBase = {
  auth: Auth
  contentTypes: ContentTypes
}
export type CommonActionContext = CommonActionContextBase & GenericActionUtilities

export type CommonActionClientContext = CommonActionContext & {

  isClient: true

  // Don't pass, since actions should be client/server agnostic
  // req: IncomingMessage
  // res: ServerResponse
  route: RouteContext
  user?: UserType
}

// Generic actions

export type GenericActionUtilities = {
  actionError: (error: { message: string, [key: string]: any }) => void | never
  ensureLoggedIn: () => boolean
  hasRole: (role: string) => boolean
  ensureRole: (role: string, throwError?: boolean) => boolean
  ensureSelf: (data: any, throwError?: boolean) => boolean
  ensureSelfOrRole: (data: any, role: string) => boolean
}

export type GenericActionContext = {
  actions: GenericActions
} & CommonActionContext

export type GenericActionClientContext = GenericActionContext & CommonActionClientContext

export type GenericAction = (
  data: ContentTypeActionData,
  context: GenericActionContext | GenericActionClientContext
) => ContentTypeActionResponse | Promise<ContentTypeActionResponse>

export type GenericActions = {
  [key: string]: GenericAction
}

// Content type actions

export type ContentTypeActionContext = CommonActionContext & {
  db: Datastore
  contentType: ContentType,
  isClient?: false
}

export type ContentTypeActionClientContext = CommonActionClientContext & {
  db: Datastore
  contentType: ContentType
}

export type ContentTypeAction = (
  data: ContentTypeActionData,
  context: ContentTypeActionContext | ContentTypeActionClientContext
) => ContentTypeActionResponse | Promise<ContentTypeActionResponse>

export type ContentTypeActionCall = (
  data: ContentTypeActionData,
  context?: ContentTypeActionContext | ContentTypeActionClientContext
) => ContentTypeActionResponse | Promise<ContentTypeActionResponse>

export type ContentTypeActions = {
  [key: string]: ContentTypeAction
}
