import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const apiHost = process.env.API_HOST || '127.0.0.1'
const apiPort = Number(process.env.API_PORT || 3000)
const webPort = 5173

async function assertPortAvailable(host, port, label) {
  const probe = createServer()
  await new Promise((resolveProbe, rejectProbe) => {
    probe.once('error', rejectProbe)
    probe.listen(port, host, () => probe.close(resolveProbe))
  }).catch((error) => {
    if (error.code === 'EADDRINUSE') {
      throw new Error(`${label}: el puerto ${port} ya esta ocupado. Cierra la otra instancia y vuelve a ejecutar npm run dev.`)
    }
    throw error
  })
}

try {
  await assertPortAvailable(apiHost, apiPort, 'La API')
  await assertPortAvailable('localhost', webPort, 'Vite')
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

const env = { ...process.env, APP_ORIGIN: process.env.APP_ORIGIN || `http://localhost:${webPort}` }
const api = spawn(process.execPath, ['--watch', resolve(root, 'backend/server.js')], { cwd: root, stdio: 'inherit', env, shell: false })
const web = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), '--host', 'localhost', '--port', String(webPort), '--strictPort'], { cwd: root, stdio: 'inherit', env, shell: false })
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  if (!api.killed) api.kill('SIGTERM')
  if (!web.killed) web.kill('SIGTERM')
  setTimeout(() => process.exit(code), 100)
}
api.on('error', (error) => { console.error(`No se pudo iniciar la API: ${error.message}`); stop(1) })
web.on('error', (error) => { console.error(`No se pudo iniciar Vite: ${error.message}`); stop(1) })
api.on('exit', (code) => { if (!stopping) stop(code ?? 1) })
web.on('exit', (code) => { if (!stopping) stop(code ?? 1) })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(0))
