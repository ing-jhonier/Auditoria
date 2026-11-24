import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const api = spawn(process.execPath, ['--watch', resolve(root, 'backend/server.js')], { cwd: root, stdio: 'inherit', env: process.env, shell: false })
const web = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js')], { cwd: root, stdio: 'inherit', env: process.env, shell: false })
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  api.kill('SIGTERM')
  web.kill('SIGTERM')
  setTimeout(() => process.exit(code), 100)
}
api.on('exit', (code) => { if (!stopping) stop(code ?? 1) })
web.on('exit', (code) => { if (!stopping) stop(code ?? 1) })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(0))
