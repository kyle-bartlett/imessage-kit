'use client'

import { useEffect, useState } from 'react'
import Card, { CardHeader } from '@/components/Card'
import { Config } from '@/lib/config'

export default function RulesPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newInstruction, setNewInstruction] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data)
        setLoading(false)
      })
  }, [])

  const addInstruction = async () => {
    if (!config || !newInstruction.trim()) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responseRules: {
          ...config.responseRules,
          customInstructions: [...config.responseRules.customInstructions, newInstruction],
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setNewInstruction('')
    setSaving(false)
  }

  const removeInstruction = async (index: number) => {
    if (!config) return
    setSaving(true)

    const newInstructions = [...config.responseRules.customInstructions]
    newInstructions.splice(index, 1)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responseRules: {
          ...config.responseRules,
          customInstructions: newInstructions,
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const addUrgentKeyword = async () => {
    if (!config || !newKeyword.trim()) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responseRules: {
          ...config.responseRules,
          urgentKeywords: [...config.responseRules.urgentKeywords, newKeyword.toLowerCase()],
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setNewKeyword('')
    setSaving(false)
  }

  const removeUrgentKeyword = async (keyword: string) => {
    if (!config) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responseRules: {
          ...config.responseRules,
          urgentKeywords: config.responseRules.urgentKeywords.filter((k) => k !== keyword),
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const addAlwaysRespondKeyword = async (keyword: string) => {
    if (!config || !keyword.trim()) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responseRules: {
          ...config.responseRules,
          alwaysRespondKeywords: [
            ...config.responseRules.alwaysRespondKeywords,
            keyword.toLowerCase(),
          ],
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const removeAlwaysRespondKeyword = async (keyword: string) => {
    if (!config) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responseRules: {
          ...config.responseRules,
          alwaysRespondKeywords: config.responseRules.alwaysRespondKeywords.filter(
            (k) => k !== keyword
          ),
        },
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
        <h1 className="text-2xl font-bold">Response Rules</h1>
        <p className="text-gray-400">Custom instructions and keyword triggers</p>
      </div>

      {/* Custom Instructions */}
      <Card>
        <CardHeader>Custom Instructions</CardHeader>
        <p className="text-sm text-gray-400 mb-4">
          Add specific rules for how the bot should respond. These are temporary and can be
          changed anytime.
        </p>
        <div className="space-y-3 mb-4">
          <textarea
            value={newInstruction}
            onChange={(e) => setNewInstruction(e.target.value)}
            placeholder="e.g., If anyone asks about Friday, say I'm busy. If someone mentions the project, tell them it's going well."
            className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
            rows={3}
          />
          <button
            onClick={addInstruction}
            disabled={saving || !newInstruction.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium"
          >
            Add Instruction
          </button>
        </div>

        {config.responseRules.customInstructions.length > 0 ? (
          <div className="space-y-2">
            {config.responseRules.customInstructions.map((instruction, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-3 p-3 bg-gray-700/50 rounded-lg"
              >
                <p className="text-white text-sm flex-1">{instruction}</p>
                <button
                  onClick={() => removeInstruction(index)}
                  className="p-1 text-red-400 hover:bg-red-500/20 rounded shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No custom instructions</p>
        )}
      </Card>

      {/* Urgent Keywords */}
      <Card>
        <CardHeader>Urgent Keywords</CardHeader>
        <p className="text-sm text-gray-400 mb-4">
          Messages containing these words are treated as urgent (bypasses DND, triggers alerts)
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Add keyword..."
            className="flex-1 p-2 bg-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addUrgentKeyword()
              }
            }}
          />
          <button
            onClick={addUrgentKeyword}
            disabled={saving || !newKeyword.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-sm"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.responseRules.urgentKeywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm"
            >
              {keyword}
              <button
                onClick={() => removeUrgentKeyword(keyword)}
                className="hover:text-white"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </Card>

      {/* Always Respond Keywords */}
      <Card>
        <CardHeader>Always Respond Keywords</CardHeader>
        <p className="text-sm text-gray-400 mb-4">
          Bot always responds when messages contain these words (even in group chats)
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Add keyword (press Enter)..."
            className="flex-1 p-2 bg-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addAlwaysRespondKeyword((e.target as HTMLInputElement).value)
                ;(e.target as HTMLInputElement).value = ''
              }
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {config.responseRules.alwaysRespondKeywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
            >
              {keyword}
              <button
                onClick={() => removeAlwaysRespondKeyword(keyword)}
                className="hover:text-white"
              >
                ✕
              </button>
            </span>
          ))}
          {config.responseRules.alwaysRespondKeywords.length === 0 && (
            <p className="text-gray-500 text-sm">No always-respond keywords</p>
          )}
        </div>
      </Card>

      {/* Quick Add Common Instructions */}
      <Card>
        <CardHeader>Quick Add</CardHeader>
        <p className="text-sm text-gray-400 mb-4">Click to add common instructions</p>
        <div className="flex flex-wrap gap-2">
          {[
            "If anyone asks where I am, say I'm busy but will respond soon",
            "Keep all responses under 2 sentences",
            "Don't commit to any plans without checking with me first",
            "If someone asks about work, say things are going well",
            "Be extra friendly with anyone who seems upset",
          ].map((instruction) => (
            <button
              key={instruction}
              onClick={async () => {
                if (!config.responseRules.customInstructions.includes(instruction)) {
                  setNewInstruction(instruction)
                }
              }}
              disabled={config.responseRules.customInstructions.includes(instruction)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-sm text-left"
            >
              {instruction}
            </button>
          ))}
        </div>
      </Card>

      {saving && (
        <div className="fixed bottom-20 md:bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving...
        </div>
      )}
    </div>
  )
}
