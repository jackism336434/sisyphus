type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogMessage {
  level: LogLevel
  message: string
  meta?: Record<string, unknown>
  source: 'renderer'
  timestamp: number
}

function sendToMain(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const logMessage: LogMessage = {
    level,
    message,
    meta,
    source: 'renderer',
    timestamp: Date.now()
  }
  window.electron.ipcRenderer.send('log:message', logMessage)
}

export const logger = {
  error: (message: string, meta?: Record<string, unknown>) => sendToMain('error', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => sendToMain('warn', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => sendToMain('info', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => sendToMain('debug', message, meta),
}
