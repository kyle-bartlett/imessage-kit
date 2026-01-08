'use client'

import { useEffect, useState } from 'react'
import Card, { CardHeader } from '@/components/Card'
import Slider from '@/components/Slider'
import Toggle from '@/components/Toggle'
import { Config } from '@/lib/config'

type EmojiUsage = 'none' | 'minimal' | 'moderate' | 'frequent'

export default function TonePage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customPersonality, setCustomPersonality] = useState('')

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data)
        setCustomPersonality(data.tone.customPersonality || '')
        setLoading(false)
      })
  }, [])

  const updateTone = async (key: string, value: number | string | boolean) => {
    if (!config) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tone: { ...config.tone, [key]: value },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const saveCustomPersonality = async () => {
    await updateTone('customPersonality', customPersonality)
  }

  const applyPreset = async (preset: 'casual' | 'professional' | 'brief' | 'friendly') => {
    if (!config) return
    setSaving(true)

    const presets = {
      casual: { casualLevel: 9, brevityLevel: 7, humorLevel: 7, emojiUsage: 'moderate' as const },
      professional: { casualLevel: 3, brevityLevel: 6, humorLevel: 2, emojiUsage: 'none' as const },
      brief: { casualLevel: 5, brevityLevel: 10, humorLevel: 3, emojiUsage: 'minimal' as const },
      friendly: { casualLevel: 8, brevityLevel: 5, humorLevel: 8, emojiUsage: 'frequent' as const },
    }

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tone: { ...config.tone, ...presets[preset] },
      }),
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Tone & Personality</h1>
        <p className="text-gray-400">Control how the bot sounds when responding</p>
      </div>

      {/* Quick Presets */}
      <Card>
        <CardHeader>Quick Presets</CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => applyPreset('casual')}
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-center"
          >
            <span className="text-2xl">😎</span>
            <p className="font-medium text-white mt-2">Casual</p>
            <p className="text-xs text-gray-400">Chill, relaxed vibes</p>
          </button>
          <button
            onClick={() => applyPreset('professional')}
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-center"
          >
            <span className="text-2xl">💼</span>
            <p className="font-medium text-white mt-2">Professional</p>
            <p className="text-xs text-gray-400">Formal, no emojis</p>
          </button>
          <button
            onClick={() => applyPreset('brief')}
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-center"
          >
            <span className="text-2xl">⚡</span>
            <p className="font-medium text-white mt-2">Brief</p>
            <p className="text-xs text-gray-400">Short and sweet</p>
          </button>
          <button
            onClick={() => applyPreset('friendly')}
            className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-center"
          >
            <span className="text-2xl">🤗</span>
            <p className="font-medium text-white mt-2">Friendly</p>
            <p className="text-xs text-gray-400">Warm and chatty</p>
          </button>
        </div>
      </Card>

      {/* Fine-tune Sliders */}
      <Card>
        <CardHeader>Fine-Tune</CardHeader>
        <div className="space-y-6">
          <Slider
            value={config.tone.casualLevel}
            onChange={(v) => updateTone('casualLevel', v)}
            label="Casual Level"
            leftLabel="Formal"
            rightLabel="Very Casual"
          />
          <Slider
            value={config.tone.brevityLevel}
            onChange={(v) => updateTone('brevityLevel', v)}
            label="Brevity"
            leftLabel="Detailed"
            rightLabel="Very Brief"
          />
          <Slider
            value={config.tone.humorLevel}
            onChange={(v) => updateTone('humorLevel', v)}
            label="Humor"
            leftLabel="Serious"
            rightLabel="Funny"
          />
        </div>
        {saving && <p className="text-sm text-blue-400 mt-4">Saving...</p>}
      </Card>

      {/* Emoji Usage */}
      <Card>
        <CardHeader>Emoji Usage</CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['none', 'minimal', 'moderate', 'frequent'] as EmojiUsage[]).map((level) => (
            <button
              key={level}
              onClick={() => updateTone('emojiUsage', level)}
              className={`p-3 rounded-lg text-center ${
                config.tone.emojiUsage === level
                  ? 'bg-blue-600 ring-2 ring-blue-400'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <p className="font-medium text-white capitalize">{level}</p>
              <p className="text-xs text-gray-300 mt-1">
                {level === 'none' && 'No emojis'}
                {level === 'minimal' && 'Rare use'}
                {level === 'moderate' && 'Sometimes'}
                {level === 'frequent' && 'Lots!'}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* Match Energy */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Match Their Energy</p>
            <p className="text-sm text-gray-400">
              Adapt response style based on how they message you
            </p>
          </div>
          <Toggle
            enabled={config.tone.matchEnergy}
            onChange={(v) => updateTone('matchEnergy', v)}
          />
        </div>
      </Card>

      {/* Custom Personality */}
      <Card>
        <CardHeader>Custom Personality Instructions</CardHeader>
        <p className="text-sm text-gray-400 mb-3">
          Add specific instructions for how the bot should behave
        </p>
        <textarea
          value={customPersonality}
          onChange={(e) => setCustomPersonality(e.target.value)}
          placeholder="e.g., Always mention that I'm a huge coffee fan. Use 'lol' instead of 'haha'. Sign off with my catchphrase..."
          className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
          rows={4}
        />
        <button
          onClick={saveCustomPersonality}
          disabled={saving || customPersonality === config.tone.customPersonality}
          className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium"
        >
          Save Personality
        </button>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>Response Preview</CardHeader>
        <div className="p-4 bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">With current settings, responses will be:</p>
          <ul className="text-sm text-white space-y-1">
            <li>
              {config.tone.casualLevel >= 7 ? '• Casual and relaxed' : '• More formal'}
            </li>
            <li>
              {config.tone.brevityLevel >= 7 ? '• Short and concise' : '• More detailed'}
            </li>
            <li>
              {config.tone.humorLevel >= 7 ? '• Includes humor and jokes' : '• Straightforward'}
            </li>
            <li>
              • Emojis: {config.tone.emojiUsage}
            </li>
            {config.tone.matchEnergy && <li>• Adapts to sender's style</li>}
          </ul>
        </div>
      </Card>
    </div>
  )
}
