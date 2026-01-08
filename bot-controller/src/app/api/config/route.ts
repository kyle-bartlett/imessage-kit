import { NextResponse } from 'next/server'
import { readConfig, writeConfig, Config } from '@/lib/config'

export async function GET() {
  try {
    const config = readConfig()
    return NextResponse.json(config)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const updates = await request.json()
    const current = readConfig()
    const updated: Config = { ...current, ...updates, lastUpdated: new Date().toISOString() }
    writeConfig(updated)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const updates = await request.json()
    const current = readConfig()

    // Deep merge for nested objects
    const merged = deepMerge(current, updates) as Config
    merged.lastUpdated = new Date().toISOString()

    writeConfig(merged)
    return NextResponse.json(merged)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
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
