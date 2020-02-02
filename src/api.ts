import { withMethod, withHandlers } from './server'
import { provideJsonData } from './middlewares/json'
import { withRoute } from './middlewares/route'
import { createAuth, Auth, AuthConfig } from './auth'
import { provideJwtToken } from './auth/jwt'
import { createContentTypes, ContentTypes, ContentTypeConfigs } from './content/type'
import { createActions, GenericActions } from './content/action'
import { createUserProvider } from './content/user'

export type ApiConfig = {
  route?: string
  auth: AuthConfig
  contentTypes: ContentTypeConfigs
  actions: GenericActions
}

export type ApiContext = {
  auth: Auth
  contentTypes: ContentTypes
  actions: GenericActions
}

export const createApi = async (config: ApiConfig) => {

  const {
    route = '/',
    auth: authConfig,
    contentTypes: contentTypeConfigs,
    actions
  } = config

  const auth = createAuth(authConfig)
  const contentTypes = await createContentTypes(contentTypeConfigs, { auth })
  const context: ApiContext = {
    auth,
    contentTypes,
    actions
  }

  const {
    serverActions,
    actionHandler
  } = await createActions(context)

  return {

    context: {
      auth,
      contentTypes,
      actions: serverActions
    },

    handler: withRoute(route)(withMethod('post')(withHandlers(

      // TODO: Provide uploads

      provideJwtToken(auth),
      createUserProvider(context),
      provideJsonData,
      actionHandler
    )))
  }
}