// Convert an absolute file path into a URL the HTMLMediaElement can request
// through our custom local-media:// protocol (registered in electron/protocol.ts).
export function toLocalMediaUrl(absolutePath: string): string {
  return `local-media://${encodeURIComponent(absolutePath)}`
}
