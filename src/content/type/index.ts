
/**
 * Document database
 *
 * @see https://github.com/bajankristof/nedb-promises
 * @see https://github.com/louischatriot/nedb
 */
import Datastore from 'nedb-promises'

import {
  ContentTypeActionCall,
  GenericActionContext,
  CommonActionContextBase,
  ContentTypeActionContext,
  ContentTypeAction,
  serverActionUtilities
} from '../action'

import {
  userContentTypeConfigs
} from '../user'

import {
  ContentTypeConfigs,
  ContentTypeConfig,
  ContentTypes,
  ContentType,
} from './schema'

export { Datastore }
export * from './schema'

const defaultContentTypeConfigs = {
  ...userContentTypeConfigs
}


export const defaultContentTypeActions = [
  'find',
  'findOne',
  'update',
  'remove',
  'insert'
].reduce((obj, actionName) => {

  const action: ContentTypeAction = async (data, context) => {
console.log('default', actionName, data)
    return await context.db[actionName](data)
  }

  obj[actionName] = action
  return obj
}, {})


export const createContentTypes = async (
  givenContentTypeConfigs: ContentTypeConfigs = {},
  { auth }
): Promise<ContentTypes> => {

  const contentTypeConfigs = {
    ...defaultContentTypeConfigs,
    ...givenContentTypeConfigs
  }

  const contentTypes = {}

  for (const typeName in contentTypeConfigs) {
    const config = contentTypeConfigs[typeName]
    contentTypes[typeName] = await createContentType(typeName, config, { auth, contentTypes })
  }

  return contentTypes
}

export const createContentType = async (
  typeName: string,
  config: ContentTypeConfig,
  actionContext: CommonActionContextBase
): Promise<ContentType> => {

  const {
    actions: givenContentTypeActions = {}
  } = config

  const {
    auth,
    contentTypes
  } = actionContext

  const db = Datastore.create(`data/${typeName}.db` as any)

  db.load()

  const actions = {
    ...defaultContentTypeActions,
    ...givenContentTypeActions
  }

  const contentType = {
    db
  } as ContentType

  const defaultContext: ContentTypeActionContext = {
    auth,
    db,
    contentTypes,
    contentType,
    ...serverActionUtilities
  }

  for (const actionName in actions) {
    contentType[ actionName ] = (data, context) => actions[ actionName ](data, {
      ...defaultContext,
      ...context
    }) as ContentTypeActionCall
  }

  if (config.defaultItems && !await db.findOne({})) {
    await contentType.insert(config.defaultItems, defaultContext)
  }

  return contentType
}