import { protocol, net } from 'electron'
import { pathToFileURL } from 'node:url'

// Custom scheme so the renderer can pull local video/audio bytes through
// HTMLMediaElement without us disabling webSecurity or exposing file://.
// Format: local-media:///<url-encoded-absolute-path>
const SCHEME = 'local-media'

export function registerLocalMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        bypassCSP: false,
        corsEnabled: true
      }
    }
  ])
}

export function installLocalMediaHandler(): void {
  protocol.handle(SCHEME, async (request) => {
    try {
      // Strip "local-media://" — the rest is a URL-encoded absolute file path
      // (we encode it on the renderer side via encodePath).
      const encoded = request.url.slice(`${SCHEME}://`.length)
      const filePath = decodeURIComponent(encoded)
      return net.fetch(pathToFileURL(filePath).toString())
    } catch (err) {
      return new Response(String(err), { status: 500 })
    }
  })
}
