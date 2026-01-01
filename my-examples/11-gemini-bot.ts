#!/usr/bin/env npx tsx
/**
 * Gemini-Powered iMessage Auto-Reply Bot (Backup)
 * 
 * Uses Google's Gemini AI as a backup to Claude.
 * Same personality and features, different AI backend.
 * 
 * Usage: npx tsx 11-gemini-bot.ts
 * Stop: Ctrl+C
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { IMessageSDK } from '../imessage-kit/dist/index.js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const CONVERSATION_MEMORY = parseInt(process.env.CONVERSATION_MEMORY || '20')

if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in .env file')
  process.exit(1)
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

// System prompt for Gemini
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

You are texting AS Bart, not as an AI assistant. Never break character or mention you're an AI.

Respond ONLY with the text message reply. No explanations, no "Here's a response:", just the actual message text.`

// Conversation history storage (per contact/chat)
const conversationHistory: Map<string, string[]> = new Map()

// Track processed messages
const processedMessages = new Set<string>()

async function getGeminiResponse(chatId: string, senderName: string, message: string): Promise<string> {
  // Get or create conversation history for this chat
  let history = conversationHistory.get(chatId) || []
  
  // Add the new message to history
  history.push(`${senderName}: ${message}`)
  
  // Keep only last N messages
  if (history.length > CONVERSATION_MEMORY) {
    history = history.slice(-CONVERSATION_MEMORY)
  }
  
  try {
    // Build the prompt with context
    const contextPrompt = `${SYSTEM_PROMPT}

Recent conversation:
${history.join('\n')}

Respond to the last message as Bart:`

    const result = await model.generateContent(contextPrompt)
    const response = result.response
    const assistantMessage = response.text().trim()
    
    // Add assistant response to history
    history.push(`Bart: ${assistantMessage}`)
    conversationHistory.set(chatId, history)
    
    return assistantMessage
  } catch (error: any) {
    console.error('Gemini API error:', error.message)
    throw error
  }
}

async function main() {
  console.log('🤖 Gemini-Powered iMessage Bot (Backup)')
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
        // Get Gemini's response
        console.log('   🧠 Thinking...')
        const reply = await getGeminiResponse(chatId, sender, text)

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
      // Skip if already processed
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
      const shouldRespond = text.toLowerCase().includes('bart') || 
                           text.toLowerCase().includes('@bart') ||
                           text.endsWith('?')

      if (!shouldRespond) {
        console.log('   ⏭️  Skipping (not addressed to Bart)')
        return
      }

      try {
        console.log('   🧠 Thinking...')
        const reply = await getGeminiResponse(chatId, sender, text)

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
