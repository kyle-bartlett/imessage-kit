#!/usr/bin/env npx tsx
/**
 * Claude-Powered iMessage Auto-Reply Bot
 * 
 * Uses Claude AI to generate friendly, casual responses to your
 * friends and family. Remembers conversation context (last 20 messages).
 * 
 * Usage: npx tsx 10-claude-bot.ts
 * Stop: Ctrl+C
 */

import Anthropic from '@anthropic-ai/sdk'
import { IMessageSDK } from '../imessage-kit/dist/index.js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '.env') })

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const CONVERSATION_MEMORY = parseInt(process.env.CONVERSATION_MEMORY || '20')

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in .env file')
  process.exit(1)
}

// Initialize Claude
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// System prompt for Claude - casual, friendly, funny for friends & family
const SYSTEM_PROMPT = `You are responding to iMessages on behalf of Bart. These messages are from friends and family only - never work related.

Your personality:
- Casual, friendly, and warm
- Witty and funny when appropriate (but not forced)
- You use emojis naturally but don't overdo it
- You keep responses conversational and relatively brief (1-3 sentences usually)
- You match the energy of whoever is texting - if they're excited, be excited back
- You can be playful and tease friends in a loving way
- For family, you're warm and caring
- You remember context from the conversation

Important:
- Never be formal or corporate sounding
- Don't use phrases like "I hope this message finds you well"
- Be genuine and human-like
- If someone asks a question you genuinely don't know the answer to, just be honest
- For group chats, keep responses even shorter and punchier

You are texting AS Bart, not as an AI assistant. Never break character or mention you're an AI.`

// Conversation history storage (per contact/chat)
const conversationHistory: Map<string, Array<{ role: 'user' | 'assistant'; content: string }>> = new Map()

// Track processed messages
const processedMessages = new Set<string>()

async function getClaudeResponse(chatId: string, senderName: string, message: string): Promise<string> {
  // Get or create conversation history for this chat
  let history = conversationHistory.get(chatId) || []
  
  // Add the new message to history
  history.push({ role: 'user', content: `${senderName}: ${message}` })
  
  // Keep only last N messages
  if (history.length > CONVERSATION_MEMORY) {
    history = history.slice(-CONVERSATION_MEMORY)
  }
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: history
    })
    
    const assistantMessage = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Hey! Got your message'
    
    // Add assistant response to history
    history.push({ role: 'assistant', content: assistantMessage })
    conversationHistory.set(chatId, history)
    
    return assistantMessage
  } catch (error: any) {
    console.error('Claude API error:', error.message)
    throw error
  }
}

async function main() {
  console.log('🤖 Claude-Powered iMessage Bot')
  console.log('━'.repeat(50))
  console.log(`📝 Personality: Casual, friendly, funny`)
  console.log(`🧠 Memory: Last ${CONVERSATION_MEMORY} messages per chat`)
  console.log('━'.repeat(50))
  console.log('\nPress Ctrl+C to stop\n')

  const sdk = new IMessageSDK({
    debug: false,
    watcher: {
      pollInterval: 2000,
      excludeOwnMessages: true,
      unreadOnly: false
    }
  })

  await sdk.startWatching({
    onDirectMessage: async (message) => {
      // Skip if already processed
      if (processedMessages.has(message.id)) return
      processedMessages.add(message.id)

      const sender = message.sender
      const text = message.text || ''
      const chatId = message.chatId || sender

      // Skip empty messages or attachments-only
      if (!text.trim()) {
        console.log(`📎 [${sender}] Sent attachment (skipping)`)
        return
      }

      console.log(`\n📨 From ${sender}:`)
      console.log(`   "${text}"`)

      try {
        // Get Claude's response
        console.log('   🧠 Thinking...')
        const reply = await getClaudeResponse(chatId, sender, text)

        console.log(`   🤖 Reply: "${reply}"`)

        // Send the reply
        await sdk.send(sender, reply)
        console.log('   ✅ Sent!')

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`)
      }

      // Clean up old processed messages
      if (processedMessages.size > 500) {
        const toDelete = Array.from(processedMessages).slice(0, 250)
        toDelete.forEach(id => processedMessages.delete(id))
      }
    },

    onGroupMessage: async (message) => {
      // Skip if already processed or from yourself
      if (processedMessages.has(message.id)) return
      processedMessages.add(message.id)

      const sender = message.sender
      const text = message.text || ''
      const chatId = message.chatId || 'unknown-group'

      // Skip empty messages
      if (!text.trim()) return

      console.log(`\n👥 Group [${chatId}] from ${sender}:`)
      console.log(`   "${text}"`)

      // For group chats, only respond if mentioned or directly addressed
      // You can customize this logic
      const shouldRespond = text.toLowerCase().includes('bart') || 
                           text.toLowerCase().includes('@bart') ||
                           text.endsWith('?') // Respond to questions

      if (!shouldRespond) {
        console.log('   ⏭️  Skipping (not addressed to Bart)')
        return
      }

      try {
        console.log('   🧠 Thinking...')
        const reply = await getClaudeResponse(chatId, sender, text)

        console.log(`   🤖 Reply: "${reply}"`)

        await sdk.send(chatId, reply)
        console.log('   ✅ Sent!')

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`)
      }
    },

    onError: (error) => {
      console.error('\n❌ Watcher error:', error.message)
    }
  })

  console.log('✅ Bot is running! Waiting for messages...\n')

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...')
    sdk.stopWatching()
    await sdk.close()
    console.log('✅ Bot stopped. Goodbye!')
    process.exit(0)
  })
}

main().catch(console.error)
