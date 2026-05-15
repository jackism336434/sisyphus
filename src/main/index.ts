import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { readFileSync, appendFile } from 'fs'
import { join, extname } from 'path'
import { registerAIHandlers } from './ai-handlers'
import { initLogger } from './logger'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0D0D0D',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initLogger()
  registerAIHandlers()
  createWindow()

  ipcMain.handle('select-files', async () => {
    if (!mainWindow) return []
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Text Files',
          extensions: [
            'txt', 'md', 'markdown', 'json', 'xml', 'csv', 'tsv',
            'js', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go', 'rs',
            'java', 'c', 'cpp', 'h', 'hpp',
            'html', 'htm', 'css', 'scss', 'less',
            'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
            'sh', 'bash', 'zsh', 'fish', 'ps1',
            'sql', 'graphql', 'vue', 'svelte',
            'log', 'env', 'gitignore', 'dockerignore',
            'makefile', 'cmake'
          ]
        },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (result.canceled || result.filePaths.length === 0) return []

    const files: { name: string; content: string; size: number }[] = []
    for (const filePath of result.filePaths) {
      try {
        const stats = await import('fs').then(m => m.statSync(filePath))
        const content = readFileSync(filePath, 'utf-8')
        files.push({
          name: join(filePath).split(/[/\\]/).pop() || filePath,
          content,
          size: stats.size
        })
      } catch {
        // skip unreadable files
      }
    }
    return files
  })

  ipcMain.handle('select-avatar', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const ext = extname(filePath).slice(1)
    const mimeMap: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp'
    }
    const mime = mimeMap[ext] || 'image/png'
    const data = readFileSync(filePath, 'base64')
    return `data:${mime};base64,${data}`
  })

  ipcMain.handle('file:saveDialog', async (_event, defaultName: string) => {
    if (!mainWindow) return null
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled || !result.filePath) return null
    return result.filePath
  })

  ipcMain.handle('file:writeChunk', async (_event, filePath: string, content: string) => {
    return new Promise<void>((resolve, reject) => {
      appendFile(filePath, content, 'utf-8', (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
