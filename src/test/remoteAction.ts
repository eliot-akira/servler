import createFetch from 'fetch-ponyfill'

const { fetch } = createFetch()

type RemoteActionProps = {
  type?: string
  action: string
  data: any
  token?: string
}

type RemoteActionResponse = {
  result: any
  error?: {
    status: number
  }
}

const remoteAction = async (url: string, props: RemoteActionProps): Promise<RemoteActionResponse> => {

  const {
    type, action, data, token
  } = props

  const body = JSON.stringify({ type, action, data })
  const headers = {
    'content-type': 'application/json'
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(url, { method: 'POST', headers, body })

  let result
  try {
    result = await response.json()
  } catch(e) { /**/ }

  if (response.status === 200) {
    return { result }
  }

  return { result, error: response }
}

export default remoteAction