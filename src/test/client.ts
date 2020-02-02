import { testGroup, runTestGroups } from 'testra'
import callRemoteAction from './remoteAction'

const testUrl = 'http://localhost:3000/'
const remoteAction = (props) => callRemoteAction(testUrl, props)

testGroup('API server', test => {

  test('API', async (it, is) => {

    const data = { key: 'hi' }
    let result, error

    result = (await remoteAction({ action: 'ping', data })).result

    it('responds', result)
    it('responds with data', result.data)
    it('responds with correct data', is(result.data, data))

    error = (await remoteAction({ action: 'pong', data })).error
    it('responds with error for non-existing action', error && error.status===404)
  })
})

testGroup('API user', test => {

  test('Visitor not logged-in', async (it, is) => {

    let error

    error = (await remoteAction({ type: 'user', action: 'find', data: {} })).error
    it('cannot run find for others', error && error.status===401)

    error = (await remoteAction({ type: 'user', action: 'findOne', data: { name: 'admin' } })).error
    it('cannot run findOne without token', error && error.status===401)

    error = (await remoteAction({ type: 'user', action: 'update', data: { query: { name: 'admin' }, update: { password: 'changed' } } })).error
    it('cannot run update without token', error && error.status===401)

    error = (await remoteAction({ type: 'user', action: 'remove', data: { name: 'admin' } })).error
    it('cannot run remove without token', error && error.status===401)

    error = (await remoteAction({ type: 'user', action: 'insert', data: { name: 'test', password: 'test' } })).error
    it('cannot run insert without token', error && error.status===401)
  })

  test('Test user', async (it, is) => {

    let result, error

    const {
      result: {
        _id: id,
        token
      }
    } = await remoteAction({ type: 'user', action: 'register', data: { name: 'test', password: 'test' } })

    it('can register', id)
    it('register returns token', token)

    error = (await remoteAction({ type: 'user', action: 'login', data: { name: 'test', password: 'test' } })).error
    it('can login', !error)

    result = (await remoteAction({ type: 'user', action: 'findOne', data: { _id: id }, token })).result
    it('can run findOne for self', result && result._id===id)

    result = (await remoteAction({ type: 'user', action: 'find', data: { _id: id }, token })).result
    it('can run find for self', result && result[0] && result[0]._id===id)

    error = (await remoteAction({ type: 'user', action: 'findOne', data: {} })).error
    it('cannot run find for others', error && error.status===401)

    error = (await remoteAction({ type: 'user', action: 'findOne', data: { name: 'admin' } })).error
    it('cannot run findOne for others', error && error.status===401)

    result = (await remoteAction({ type: 'user', action: 'update', data: { query:{ _id: id }, update: { password: 'another' } }, token })).result
    it('can run update for self', result===1)

    error = (await remoteAction({ type: 'user', action: 'update', data: { query:{ _id: id }, update: { name: 'test3' } }, token })).error
    it('cannot update name for self', error.status===401)

    result = (await remoteAction({ type: 'user', action: 'findOne', data: { _id: id }, token })).result
    it('name is not updated', result && result.name==='test')

    error = (await remoteAction({ type: 'user', action: 'remove', data: { name: 'test' }, token })).error
    it('cannot remove self', error && error.status && error.status!==200)

  })

  test('Admin user', async (it, is) => {

    let res = await remoteAction({ type: 'user', action: 'login', data: { name: 'admin', password: 'admin' } })

    const { token } = res.result

    it('can login', res.result && res.result._id && token)

    res = (await remoteAction({ type: 'user', action: 'update', data: { query:{ name: 'test' }, update: { password: 'test3' } }, token }))
    it('can update test user', res.result && res.result===1)

    const {
      result: { removed },
      error: removeError
    } = await remoteAction({ type: 'user', action: 'remove', data: { name: 'test' }, token })

    it('can remove test user', !removeError && removed===1)

    res = await remoteAction({ type: 'user', action: 'insert', data: { name: 'test2', password: 'test2' }, token })
    it('can insert user', !res.error && res.result && res.result._id)

    res = await remoteAction({ type: 'user', action: 'remove', data: { name: 'test2' }, token })
    it('can remove user', !res.error && res.result && res.result.removed===1)

  })

})

runTestGroups()
