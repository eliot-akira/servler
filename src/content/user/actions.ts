import { ContentTypeAction } from '../action'
import { UserType, cleanUserData } from './index'

export const find: ContentTypeAction = async (data, context) => {
  const {
    db,
    isClient, ensureLoggedIn, ensureSelfOrRole
  } = context

  if (isClient && (!ensureLoggedIn() || !ensureSelfOrRole(data, 'admin'))) return

  return (await db.find(data)).map(cleanUserData)
}


export const findOne: ContentTypeAction = async (data, context) => {
  const {
    db,
    isClient, ensureLoggedIn, ensureSelfOrRole
  } = context

  if (isClient && (!ensureLoggedIn() || !ensureSelfOrRole(data, 'admin'))) return

  return cleanUserData(await db.findOne(data))
}


export const update: ContentTypeAction = async (data, context) => {

  const {
    auth,
    db,
    isClient, ensureLoggedIn, ensureSelfOrRole, hasRole,
    actionError
  } = context

  if (!data.query || !data.update) {
    actionError({ status: 401, message: 'Query and update required' })
    return
  }

  if (isClient && (!ensureLoggedIn() || !ensureSelfOrRole(data.query, 'admin'))) return

  const {
    $replace = false,
    $upsert = false,
    ...query
  } = data.query

  let updateQuery = data.update

  if (updateQuery.name != null && !hasRole('admin')) {
    return actionError({ status: 401, message: 'Cannot change name' })
  }

  // Remove reserved fields
  const reservedFields = ['_id', 'hashedPassword']
  for (const field of reservedFields) {
    if (updateQuery[field] != null) {
      delete updateQuery[field]
    }
  }

  if (updateQuery.password) {
    updateQuery.hashedPassword = await auth.createHash(updateQuery.password)
    delete updateQuery.password
  }

  // Roles
  if (typeof updateQuery.roles!=='undefined' && !hasRole('admin')) {
    return actionError({ status: 401, message: 'Cannot change roles' })
  }

  // Translate update query
  let commandCount = 0
  for (const key of Object.keys(updateQuery)) {
    if (key[0]==='$') {
      commandCount++
      break
    }
  }

  if (!commandCount && !$replace) {
    updateQuery = { $set: updateQuery }
  }

  return await db.update(query, updateQuery, { upsert: $upsert })
}


export const insert: ContentTypeAction = async (data, context) => {
  const {
    auth,
    db,
    contentType,
    isClient, ensureLoggedIn, ensureRole,
    actionError
  } = context

  if (isClient && (!ensureLoggedIn() || !ensureRole('admin'))) return

  const hasMultipleItems = Array.isArray(data)
  const items = (hasMultipleItems ? data : [data]) as UserType[]
  const results: any[] = []

  for (const item of items) {

    const { name, password, roles = ['user'], ...saveData } = item

    // Check exising user name

    if (await contentType.findOne({ name })) {
      actionError({ status: 401, message: 'User name exists' })
      return
    }

    if (!password || !name) {
      actionError({ status: 401, message: 'Name and password required' })
      return
    }

    // Save hashed password

    saveData.hashedPassword = await auth.createHash(password)

    const { _id } = await db.insert({
      ...saveData,
      name,
      roles
    })

    results.push({ _id })
  }

  if (hasMultipleItems) return results
  return results[0]
}


export const remove: ContentTypeAction = async (data, context) => {
  const {
    db,
    isClient, ensureLoggedIn, ensureRole
  } = context

  const {
    $multi = false,
    ...query
  } = data

  // Non-admin cannot remove self

  if (isClient && (!ensureLoggedIn() || !ensureRole('admin'))) return

  const removed = await db.remove(query, { multi: $multi })

  return { removed }
}


export const register: ContentTypeAction = async (data, context) => {

  const {
    contentType,
    actionError
  } = context

  const { name, password } = data

  if (!name || !password) {
    return actionError({ status: 401, message: 'Name and password required' })
  }

  const user = await contentType.insert({
    ...data,
    roles: ['user']
  })

  if (!user) return actionError({ status: 401, message: 'Failed to create user' })

  return await contentType.login({ name, password })
}


export const login: ContentTypeAction = async (data, context) => {

  const {
    auth,
    db,
    actionError,
  } = context

  const { name, password } = data

  if (!name || !password) {
    return actionError({ status: 401, message: 'Name and password required' })
  }

  const user: any = await db.findOne({ name })

  if (!user || !await auth.compareHash(password, user.hashedPassword)) {
    return actionError({ status: 401, message: 'Wrong credentials for user' })
  }

  const token = await auth.encodeToken(user._id)

  return {
    ...cleanUserData(user),
    token
  }
}
