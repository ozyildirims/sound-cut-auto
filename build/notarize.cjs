// electron-builder afterSign hook: notarize the .app via @electron/notarize.
// Skipped automatically if the required env vars are not set, so local dev
// builds don't fail. To enable:
//   APPLE_ID=you@example.com
//   APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
//   APPLE_TEAM_ID=XXXXXXXXXX
// Optional: APPLE_NOTARIZE=1 to force-enable.

const path = require('node:path')

module.exports = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') return

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID, APPLE_NOTARIZE } = process.env
  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    if (APPLE_NOTARIZE === '1') {
      throw new Error('Notarization requested but APPLE_ID / password / team id missing.')
    }
    console.warn('[notarize] skipped (no APPLE_* env vars set)')
    return
  }

  const { notarize } = await import('@electron/notarize')
  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(appOutDir, `${appName}.app`)
  console.log('[notarize] submitting', appPath)
  await notarize({
    tool: 'notarytool',
    appPath,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
    teamId: APPLE_TEAM_ID
  })
  console.log('[notarize] success')
}
