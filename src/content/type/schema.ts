import {
  ContentTypeActions,
  ContentTypeActionCall
} from '../action'

export type ContentTypeItem = {
  [key: string]: any
}

export type ContentTypeConfig = {
  defaultItems?: ContentTypeItem[],
  actions?: ContentTypeActions
}

export type ContentTypeConfigs = {
  [key: string]: ContentTypeConfig
}

export type ContentType = {
  db: Datastore
} & {
  [key: string]: ContentTypeActionCall
}

export type ContentTypes = {
  [key: string]: ContentType
}
