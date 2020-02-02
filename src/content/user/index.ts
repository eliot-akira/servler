import { ApiContext } from '../../api'
import { ContentTypeConfigs, ContentTypes } from '../type'
import * as userActions from './actions'
import { cleanUserData } from './utils'

export * from './utils'

export type UserType = {
  _id: string,
  name: string,
  roles: string[],
  [key: string]: any
}

const defaultAdminUser = {
  name: 'admin',
  password: 'admin',
  roles: ['admin']
}

export const userContentTypeConfigs: ContentTypeConfigs = {
  user: {
    defaultItems: [ defaultAdminUser ],
    actions: userActions
  }
}

export const createUserProvider = (apiContext: ApiContext) => {

  const {
    contentTypes
  } = apiContext

  const findUserById = (_id: string) => contentTypes.user.db.findOne({ _id })

  return async (req, res) => {

    const { jwt } = req
    if (!jwt) return

    const { sub: id } = jwt
    req.user = cleanUserData(await findUserById(id))
  }
}
