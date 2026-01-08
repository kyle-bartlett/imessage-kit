'use client'

import { useEffect, useState } from 'react'
import Card, { CardHeader } from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import Toggle from '@/components/Toggle'
import Link from 'next/link'
import { Config } from '@/lib/config'

export default function Dashboard() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data)
        setLoading(false)
      })
  }, [])

  const updateSetting = async (path: string, value: unknown) => {
    if (!config) return
    setSaving(true)

    const keys = path.split('.')
    const updates: Record<string, unknown> = {}
    let current = updates
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = {}
      current = current[keys[i]] as Record<string, unknown>
    }
    current[keys[keys.length - 1]] = value

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!config) return null

  const activeScenario = config.scenario.presets[config.scenario.active]
  const lastUpdated = new Date(config.lastUpdated).toLocaleString()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm">Last updated: {lastUpdated}</p>
        </div>
        <StatusBadge
          active={config.settings.botEnabled}
          label={config.settings.botEnabled ? 'Bot Active' : 'Bot Paused'}
        />
      </div>

      {/* Quick Controls */}
      <Card>
        <CardHeader>Quick Controls</CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Bot Enabled</p>
              <p className="text-sm text-gray-400">Master on/off switch</p>
            </div>
            <Toggle
              enabled={config.settings.botEnabled}
              onChange={(v) => updateSetting('settings.botEnabled', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Group Chats</p>
              <p className="text-sm text-gray-400">Respond to group messages</p>
            </div>
            <Toggle
              enabled={config.settings.groupChatsEnabled}
              onChange={(v) => updateSetting('settings.groupChatsEnabled', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Direct Messages</p>
              <p className="text-sm text-gray-400">Respond to DMs</p>
            </div>
            <Toggle
              enabled={config.settings.directMessagesEnabled}
              onChange={(v) => updateSetting('settings.directMessagesEnabled', v)}
            />
          </div>
        </div>
        {saving && <p className="text-sm text-blue-400 mt-4">Saving...</p>}
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>Current Scenario</CardHeader>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{activeScenario?.icon || '🟢'}</span>
          <div className="flex-1">
            <p className="text-xl font-semibold text-white">
              {activeScenario?.label || config.scenario.active}
            </p>
            {activeScenario?.message && (
              <p className="text-gray-400 text-sm mt-1">{activeScenario.message}</p>
            )}
          </div>
          <Link
            href="/scenarios"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
          >
            Change
          </Link>
        </div>
        {config.scenario.custom.enabled && config.scenario.custom.message && (
          <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-300">Custom message active:</p>
            <p className="text-white mt-1">{config.scenario.custom.message}</p>
          </div>
        )}
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-white">
            {config.contacts.priority.length}
          </p>
          <p className="text-sm text-gray-400">Priority Contacts</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-white">
            {config.contacts.blocked.length}
          </p>
          <p className="text-sm text-gray-400">Blocked</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-white">
            {Object.keys(config.chats.rules).length}
          </p>
          <p className="text-sm text-gray-400">Chat Rules</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-white">
            {config.responseRules.customInstructions.length}
          </p>
          <p className="text-sm text-gray-400">Custom Rules</p>
        </Card>
      </div>

      {/* Tone Summary */}
      <Card>
        <CardHeader>Current Tone</CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">Casual</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${config.tone.casualLevel * 10}%` }}
                />
              </div>
              <span className="text-sm text-white">{config.tone.casualLevel}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Brevity</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${config.tone.brevityLevel * 10}%` }}
                />
              </div>
              <span className="text-sm text-white">{config.tone.brevityLevel}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Humor</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full">
                <div
                  className="h-2 bg-yellow-500 rounded-full"
                  style={{ width: `${config.tone.humorLevel * 10}%` }}
                />
              </div>
              <span className="text-sm text-white">{config.tone.humorLevel}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Emojis</p>
            <p className="text-white capitalize">{config.tone.emojiUsage}</p>
          </div>
        </div>
        <Link
          href="/tone"
          className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm"
        >
          Adjust tone settings →
        </Link>
      </Card>
    </div>
  )
}
