import { prisma } from './prisma'
import fs from 'fs'
import path from 'path'

const ENV_PATH = path.join(process.cwd(), '.env.local')
const LOCAL_SETTINGS_PATH = path.join(process.cwd(), '.local-data', 'settings.json')

/** Parse a single .env.local file and return key→value map */
function readEnvFile(): Record<string, string> {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8')
    const result: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx < 0) continue
      const k = trimmed.slice(0, eqIdx).trim()
      const v = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
      if (k && v) result[k] = v
    }
    return result
  } catch {
    return {}
  }
}

/** Read server-side settings JSON file (fallback when no DB) */
function readLocalSettings(): Record<string, string> {
  try {
    if (!fs.existsSync(LOCAL_SETTINGS_PATH)) return {}
    return JSON.parse(fs.readFileSync(LOCAL_SETTINGS_PATH, 'utf-8')) as Record<string, string>
  } catch {
    return {}
  }
}

/** Write a key to the server-side settings file */
export function writeLocalSetting(key: string, value: string): void {
  try {
    const dir = path.dirname(LOCAL_SETTINGS_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const current = readLocalSettings()
    current[key] = value
    fs.writeFileSync(LOCAL_SETTINGS_PATH, JSON.stringify(current, null, 2), 'utf-8')
  } catch { /* ignore */ }
}

/** Delete a key from the server-side settings file */
export function deleteLocalSetting(key: string): void {
  try {
    if (!fs.existsSync(LOCAL_SETTINGS_PATH)) return
    const current = readLocalSettings()
    delete current[key]
    fs.writeFileSync(LOCAL_SETTINGS_PATH, JSON.stringify(current, null, 2), 'utf-8')
  } catch { /* ignore */ }
}

/**
 * Gets an API key/setting by checking in order:
 * 1. process.env (loaded at startup)
 * 2. .env.local file (read fresh each time — no restart needed)
 * 3. .local-data/settings.json (server-side JSON file, written when DB is unavailable)
 * 4. Database (Prisma Setting table)
 */
export async function getApiKey(key: string): Promise<string | undefined> {
  // 1. process.env (set at startup or via system env)
  const envVal = process.env[key]
  if (envVal && envVal.trim()) return envVal.trim()

  // 2. Read .env.local directly (picks up changes without restart)
  const fileEnv = readEnvFile()
  if (fileEnv[key]) return fileEnv[key]

  // 3. Server-side local settings file (written by /api/settings when DB unavailable)
  const localSettings = readLocalSettings()
  if (localSettings[key]?.trim()) return localSettings[key].trim()

  // 4. DB fallback
  try {
    const setting = await prisma.setting.findUnique({ where: { key } })
    if (setting?.value?.trim()) return setting.value.trim()
  } catch {
    // DB not connected — skip
  }

  return undefined
}
