import fs from 'fs'
import dotEnv from 'dotenv'
import { Server as WebSocketServer } from 'socket.io'
import { AuthConfig } from './auth'
import { ApiConfig, ApiContext } from './api'

const DAY_IN_SECONDS = 24 * 60 * 60

export type ServiceConfig = {
  port: number
  auth: AuthConfig
  isDev: boolean

  socketPort?: number
  webSocketServer?: (io: WebSocketServer, apiContext: ApiContext) => void
} & ApiConfig

export const createConfig = (givenConfig?): ServiceConfig => {

  const dotenvFiles = [
    `.env.${process.env.NODE_ENV}.local`,
    `.env.${process.env.NODE_ENV}`
  ]

  for (const dotenvFile of dotenvFiles) {
    if (!fs.existsSync(dotenvFile)) continue
    dotEnv.config({ path: dotenvFile })
    break
  }

  const config: ServiceConfig = {
    port: process.env.PORT || 3000,
    auth: {
      tokenSecret: process.env.JWT_TOKEN_SECRET || 'temporary secret',
      expireDuration: 14 * DAY_IN_SECONDS
    },
    isDev: process.env.NODE_ENV==='development',
    ...givenConfig
  }

  return config
}
