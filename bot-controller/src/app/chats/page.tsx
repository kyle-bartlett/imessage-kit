'use client'

import { useEffect, useState } from 'react'
import Card, { CardHeader } from '@/components/Card'
import Toggle from '@/components/Toggle'
import { Config, ChatRule } from '@/lib/config'

export default function ChatsPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newChatId, setNewChatId] = useState('')
  const [newChatInstructions, setNewChatInstructions] = useState('')

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data)
        setLoading(false)
      })
  }, [])

  const updateDefaultEnabled = async (enabled: boolean) => {
    if (!config) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chats: { ...config.chats, defaultEnabled: enabled },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const addChatRule = async () => {
    if (!config || !newChatId.trim()) return
    setSaving(true)

    const newRule: ChatRule = {
      enabled: true,
      customInstructions: newChatInstructions || undefined,
    }

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chats: {
          ...config.chats,
          rules: { ...config.chats.rules, [newChatId]: newRule },
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setNewChatId('')
    setNewChatInstructions('')
    setSaving(false)
  }

  const toggleChatRule = async (chatId: string, enabled: boolean) => {
    if (!config) return
    setSaving(true)

    const currentRule = config.chats.rules[chatId] || { enabled: true }
    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chats: {
          ...config.chats,
          rules: {
            ...config.chats.rules,
            [chatId]: { ...currentRule, enabled },
          },
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const removeChatRule = async (chatId: string) => {
    if (!config) return
    setSaving(true)

    const newRules = { ...config.chats.rules }
    delete newRules[chatId]

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chats: { ...config.chats, rules: newRules },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const addPriorityContact = async (contact: string) => {
    if (!config || !contact.trim()) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: {
          ...config.contacts,
          priority: [...config.contacts.priority, contact],
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const removePriorityContact = async (contact: string) => {
    if (!config) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: {
          ...config.contacts,
          priority: config.contacts.priority.filter((c) => c !== contact),
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const addBlockedContact = async (contact: string) => {
    if (!config || !contact.trim()) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: {
          ...config.contacts,
          blocked: [...config.contacts.blocked, contact],
        },
      }),
    })
    const updated = await res.json()
    setConfig(updated)
    setSaving(false)
  }

  const removeBlockedContact = async (contact: string) => {
    if (!config) return
    setSaving(true)

    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacts: {
          ...config.contacts,
          blocked: config.contacts.blocked.filter((c) => c !== contact),
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

  const chatRules = Object.entries(config.chats.rules)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Chat Management</h1>
        <p className="text-gray-400">Control which chats the bot responds to</p>
      </div>

      {/* Default Behavior */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Default: Respond to All Chats</p>
            <p className="text-sm text-gray-400">
              When enabled, bot responds to new chats automatically
            </p>
          </div>
          <Toggle
            enabled={config.chats.defaultEnabled}
            onChange={updateDefaultEnabled}
          />
        </div>
      </Card>

      {/* Add Chat Rule */}
      <Card>
        <CardHeader>Add Chat Rule</CardHeader>
        <p className="text-sm text-gray-400 mb-4">
          Add a specific chat/group to enable or customize bot behavior
        </p>
        <div className="space-y-3">
          <input
            type="text"
            value={newChatId}
            onChange={(e) => setNewChatId(e.target.value)}
            placeholder="Chat ID or phone number (e.g., +1234567890 or chat123456)"
            className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500"
          />
          <input
            type="text"
            value={newChatInstructions}
            onChange={(e) => setNewChatInstructions(e.target.value)}
            placeholder="Custom instructions for this chat (optional)"
            className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500"
          />
          <button
            onClick={addChatRule}
            disabled={saving || !newChatId.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium"
          >
            Add Chat Rule
          </button>
        </div>
      </Card>

      {/* Chat Rules List */}
      <Card>
        <CardHeader>Chat Rules ({chatRules.length})</CardHeader>
        {chatRules.length === 0 ? (
          <p className="text-gray-400 text-sm">No specific chat rules configured</p>
        ) : (
          <div className="space-y-3">
            {chatRules.map(([chatId, rule]) => (
              <div
                key={chatId}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{chatId}</p>
                  {rule.customInstructions && (
                    <p className="text-xs text-gray-400 truncate mt-1">
                      {rule.customInstructions}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Toggle
                    enabled={rule.enabled}
                    onChange={(v) => toggleChatRule(chatId, v)}
                  />
                  <button
                    onClick={() => removeChatRule(chatId)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Priority Contacts */}
      <Card>
        <CardHeader>Priority Contacts</CardHeader>
        <p className="text-sm text-gray-400 mb-4">
          These contacts always get faster, more attentive responses
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Phone number or email"
            className="flex-1 p-2 bg-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addPriorityContact((e.target as HTMLInputElement).value)
                ;(e.target as HTMLInputElement).value = ''
              }
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {config.contacts.priority.map((contact) => (
            <span
              key={contact}
              className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
            >
              {contact}
              <button
                onClick={() => removePriorityContact(contact)}
                className="hover:text-white"
              >
                ✕
              </button>
            </span>
          ))}
          {config.contacts.priority.length === 0 && (
            <p className="text-gray-500 text-sm">No priority contacts</p>
          )}
        </div>
      </Card>

      {/* Blocked Contacts */}
      <Card>
        <CardHeader>Blocked Contacts</CardHeader>
        <p className="text-sm text-gray-400 mb-4">
          Bot will never auto-respond to these contacts
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Phone number or email"
            className="flex-1 p-2 bg-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addBlockedContact((e.target as HTMLInputElement).value)
                ;(e.target as HTMLInputElement).value = ''
              }
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {config.contacts.blocked.map((contact) => (
            <span
              key={contact}
              className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm"
            >
              {contact}
              <button
                onClick={() => removeBlockedContact(contact)}
                className="hover:text-white"
              >
                ✕
              </button>
            </span>
          ))}
          {config.contacts.blocked.length === 0 && (
            <p className="text-gray-500 text-sm">No blocked contacts</p>
          )}
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
