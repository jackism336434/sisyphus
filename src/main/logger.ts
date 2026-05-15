import logger from 'electron-log/main'
import { app } from 'electron'
import { join } from 'path'

export interface LogConfig {
  enabled: boolean
  level: 'error' | 'warn' | 'info' | 'debug'
  console: boolean
  file: boolean
}

const defaultConfig: LogConfig = {
  enabled: true,
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  console: process.env.NODE_ENV === 'development',
  file: true
}

let config: LogConfig = { ...defaultConfig }

export function initLogger(): void {
  if (!config.enabled) return

  logger.transports.file.level = config.file ? config.level : false
  logger.transports.console.level = config.console ? config.level : false

  logger.transports.file.resolvePathFn = () => {
    return join(app.getPath('userData'), 'logs', 'main.log')
  }

  logger.info('[Main] Logger initialized')
  logger.info(`[Main] Log level: ${config.level}`)
}

export function updateLogger(newConfig: Partial<LogConfig>): void {
  config = { ...config, ...newConfig }
  initLogger()
}

export function getLogger(): typeof logger {
  return logger
}
