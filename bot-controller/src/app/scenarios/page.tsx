'use client'

import { useEffect, useState } from 'react'
import Card, { CardHeader } from '@/components/Card'
import Toggle from '@/components/Toggle'
import { Config, Scenario } from '@/lib/config'

export default function ScenariosPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  const [customHours, setCustomHours] = useState(6)

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data)
        setCustomMessage(data.scenario.custom.message || '')
        setLoading(false)
      })
  }, [])

  const selectScenario = async (key: string) => {
    if (!config) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: {
          ...config.scenario,
          active: key,
          custom: { ...config.scenario.custom, enabled: false },
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const activateCustom = async () => {
    if (!config || !customMessage.trim()) return
    setSaving(true)

    const expiresAt = new Date(Date.now() + customHours * 60 * 60 * 1000).toISOString()

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: {
          ...config.scenario,
          custom: {
            enabled: true,
            message: customMessage,
            expiresAt,
          },
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const clearCustom = async () => {
    if (!config) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: {
          ...config.scenario,
          custom: { enabled: false, message: '', expiresAt: null },
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setCustomMessage('')
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

  const presets = Object.entries(config.scenario.presets) as [string, Scenario][]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Scenarios</h1>
        <p className="text-gray-400">Set your current status and how the bot should respond</p>
      </div>

      {/* Presets */}
      <Card>
        <CardHeader>Quick Presets</CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {presets.map(([key, scenario]) => {
            const isActive = config.scenario.active === key && !config.scenario.custom.enabled
            return (
              <button
                key={key}
                onClick={() => selectScenario(key)}
                disabled={saving}
                className={`p-4 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-blue-600 ring-2 ring-blue-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <span className="text-2xl">{scenario.icon}</span>
                <p className="font-medium text-white mt-2">{scenario.label}</p>
                <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                  {scenario.message || 'No auto-message'}
                </p>
                <div className="flex gap-2 mt-2">
                  {scenario.urgentOnly && (
                    <span className="text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded">
                      Urgent only
                    </span>
                  )}
                  {!scenario.respondToAll && (
                    <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded">
                      Limited
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        {saving && <p className="text-sm text-blue-400 mt-4">Saving...</p>}
      </Card>

      {/* Custom Status */}
      <Card>
        <CardHeader>Custom Status</CardHeader>
        {config.scenario.custom.enabled ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-blue-300">Custom status active</p>
                  <p className="text-white mt-1">{config.scenario.custom.message}</p>
                  {config.scenario.custom.expiresAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Expires: {new Date(config.scenario.custom.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={clearCustom}
                  disabled={saving}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Custom message (what the bot should tell people)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="e.g., I'm off my phone for the next few hours - I'll text you back later!"
                className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Auto-expire after
              </label>
              <div className="flex gap-2">
                {[1, 2, 4, 6, 8, 12, 24].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setCustomHours(hours)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      customHours === hours
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={activateCustom}
              disabled={saving || !customMessage.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium"
            >
              Activate Custom Status
            </button>
          </div>
        )}
      </Card>

      {/* Scenario Details */}
      <Card>
        <CardHeader>Scenario Behavior</CardHeader>
        <div className="space-y-4">
          <div className="p-4 bg-gray-700/50 rounded-lg">
            <p className="font-medium text-white">
              Current: {config.scenario.presets[config.scenario.active]?.icon}{' '}
              {config.scenario.presets[config.scenario.active]?.label}
            </p>
            <ul className="mt-2 text-sm text-gray-400 space-y-1">
              <li>
                {config.scenario.presets[config.scenario.active]?.respondToAll
                  ? '✓ Responds to all messages'
                  : '✗ Limited responses'}
              </li>
              <li>
                {config.scenario.presets[config.scenario.active]?.urgentOnly
                  ? '! Only responds to urgent messages'
                  : '✓ Responds to normal messages'}
              </li>
              <li>
                {config.scenario.presets[config.scenario.active]?.message
                  ? `✓ Auto-message: "${config.scenario.presets[config.scenario.active]?.message}"`
                  : '✗ No automatic status message'}
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
