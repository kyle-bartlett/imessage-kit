import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), '..', 'my-examples', 'kyle-config.json')

export interface Scenario {
  label: string
  icon: string
  message: string | null
  respondToAll: boolean
  urgentOnly: boolean
}

export interface ChatRule {
  enabled: boolean
  customTone?: string
  customInstructions?: string
}

export interface Config {
  version: string
  lastUpdated: string
  scenario: {
    active: string
    presets: Record<string, Scenario>
    custom: {
      enabled: boolean
      message: string
      expiresAt: string | null
    }
  }
  tone: {
    casualLevel: number
    brevityLevel: number
    humorLevel: number
    emojiUsage: 'none' | 'minimal' | 'moderate' | 'frequent'
    matchEnergy: boolean
    customPersonality: string
  }
  chats: {
    defaultEnabled: boolean
    rules: Record<string, ChatRule>
  }
  contacts: {
    priority: string[]
    blocked: string[]
  }
  responseRules: {
    urgentKeywords: string[]
    alwaysRespondKeywords: string[]
    customInstructions: string[]
  }
  settings: {
    botEnabled: boolean
    groupChatsEnabled: boolean
    directMessagesEnabled: boolean
    apiLimitPerDay: number
  }
}

export function readConfig(): Config {
  const data = fs.readFileSync(CONFIG_PATH, 'utf-8')
  return JSON.parse(data)
}

export function writeConfig(config: Config): void {
  config.lastUpdated = new Date().toISOString()
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

export function updateConfig(updates: Partial<Config>): Config {
  const current = readConfig()
  const updated = deepMerge(current, updates) as Config
  writeConfig(updated)
  return updated
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(target: any, source: any): any {
  const result = { ...target }
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key])
    } else if (source[key] !== undefined) {
      result[key] = source[key]
    }
  }
  return result
}
