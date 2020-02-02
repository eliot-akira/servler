import http from 'http'
import { send } from 'micro'
import createSocketIO from 'socket.io'
import { createConfig, ServiceConfig } from './config'
import { createServer, serveStatic } from './server'
import { createApi, ApiConfig } from './api'

export default async (givenConfig?) => {

  const config: ServiceConfig = createConfig(givenConfig)
  const {
    port,
    socketPort = config.port,
    webSocketServer: webSocketHandler
  } = config

  const {
    context: apiContext,
    handler: apiHandler,
  } = await createApi(config as ApiConfig)

  const server = createServer(
    apiHandler,
    // serveStatic('.'),
    (req, res) => send(res, 404)
  )

  try {
    server.listen(port)
  } catch(e) {
    console.error(`Error starting service at port ${port}`, e)
    return
  }

  console.log(`Service listening at ${
    config.isDev
      ? 'http://localhost:'
      : 'port '
  }${port}`)

  let webSocketServer
  if (webSocketHandler) {

    const isDifferentPort = socketPort !== port
    webSocketServer = isDifferentPort
      ? http.createServer()
      : server

    if (isDifferentPort) {
      server.listen(socketPort)
    }
    console.log(`WebSocket server listening at port ${socketPort}`)

    const io = createSocketIO(webSocketServer)

    await webSocketHandler(io, apiContext)
  }

  // Clean exit

  const onExit = () => {
    server.close()
    if (webSocketServer) webSocketServer.close()
    process.exit(0)
  }

  const onError = (err) => {
    server.close()
    if (webSocketServer) webSocketServer.close()
    process.exit(0)
  }

  process.on('SIGTERM', onExit)
  process.on('exit', onExit)
  process.on('uncaughtException', (err) => {
    console.error('Server uncaught exception', err)
    onError(err)
  })

  return server
}
