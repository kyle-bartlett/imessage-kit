#!/usr/bin/env npx tsx
/**
 * AI-Powered iMessage Bot with Fallback
 * 
 * PRIMARY: Claude (Anthropic)
 * BACKUP: Gemini (Google) - kicks in if Claude fails
 * 
 * Features:
 * - 20 message conversation memory per chat
 * - Casual, friendly, funny personality
 * - Automatic fallback if primary AI fails
 * - Group chat support (responds when mentioned or to questions)
 * - COST CONTROLS: Daily API limits and rate limiting
 * - SPAM PROTECTION: Auto-replies "STOP" to marketing spam
 * 
 * Usage: npx tsx 12-ai-bot-with-fallback.ts
 * Stop: Ctrl+C
 */

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { IMessageSDK } from '../imessage-kit/dist/index.js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { appendFileSync } from 'fs'

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '.env') })

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const CONVERSATION_MEMORY = parseInt(process.env.CONVERSATION_MEMORY || '20')

// ============================================
// COST CONTROL SETTINGS
// ============================================
const DAILY_API_LIMIT = parseInt(process.env.DAILY_API_LIMIT || '100')  // Max API calls per day
const MIN_RESPONSE_DELAY_MS = 3000  // Minimum 3 seconds between responses (feels more human too)
const RATE_LIMIT_WINDOW_MS = 60000  // 1 minute window
const MAX_REQUESTS_PER_MINUTE = 10  // Max 10 requests per minute

// ============================================
// SPAM DETECTION PATTERNS
// ============================================
const SPAM_PATTERNS = [
  /\bunsubscribe\b/i,
  /\bopt[- ]?out\b/i,
  /\breply\s+stop\b/i,
  /\btext\s+stop\b/i,
  /\bpromo(tion|tional)?\b/i,
  /\bdiscount\b/i,
  /\bsale\b.*\b(off|%)\b/i,
  /\blimited[- ]time\b/i,
  /\bact\s+now\b/i,
  /\bfree\s+(gift|trial|shipping)\b/i,
  /\bwinning\b/i,
  /\bcongrat(ulation)?s?\b.*\b(won|winner|selected)\b/i,
  /\bclaim\s+(your|now)\b/i,
  /\bverify\s+(your\s+)?(account|identity)\b/i,
  /\bsuspicious\s+activity\b/i,
  /\b(click|tap)\s+(here|now|link)\b/i,
  /\bshort\s*code\b/i,
  /msg\s*&?\s*data\s*rates/i,
  /\b\d{5,6}\b.*\b(code|verify)\b/i,  // 5-6 digit codes (but check context)
]

// Known spam short codes and marketing numbers (add more as needed)
const SPAM_SENDERS: Set<string> = new Set([
  // Add known spam numbers here, e.g.:
  // '+18005551234',
  // '12345',  // Short codes
])

if (!ANTHROPIC_API_KEY && !GEMINI_API_KEY) {
  console.error('Missing both ANTHROPIC_API_KEY and GEMINI_API_KEY in .env file')
  console.error('At least one API key is required.')
  process.exit(1)
}

// Initialize AI clients
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null
const geminiModel = genAI?.getGenerativeModel({ model: 'gemini-1.5-flash' })

// System prompt - same for both AIs
const SYSTEM_PROMPT = `You are responding to iMessages on behalf of Kyle. These messages are from friends and family only - never work related.

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

You are texting AS Kyle, not as an AI assistant. Never break character or mention you're an AI.`

// Conversation history storage
interface Message {
  role: 'user' | 'assistant'
  content: string
}
const conversationHistory: Map<string, Message[]> = new Map()

// Track processed messages
const processedMessages = new Set<string>()

// ============================================
// COST CONTROL TRACKING
// ============================================
let dailyApiCalls = 0
let dailyResetDate = new Date().toDateString()
const recentRequests: Array<number> = []  // Timestamps of recent requests
let lastResponseTime = 0

// Stats tracking
let claudeSuccesses = 0
let geminiFallbacks = 0
let totalErrors = 0
let spamBlocked = 0
let rateLimited = 0

// Spam log file
const SPAM_LOG_FILE = resolve(__dirname, 'spam-log.txt')

// ============================================
// HELPER FUNCTIONS
// ============================================

function resetDailyCounterIfNeeded() {
  const today = new Date().toDateString()
  if (today !== dailyResetDate) {
    dailyApiCalls = 0
    dailyResetDate = today
    console.log('📅 Daily API counter reset')
  }
}

function canMakeApiCall(): { allowed: boolean; reason?: string } {
  resetDailyCounterIfNeeded()
  
  // Check daily limit
  if (dailyApiCalls >= DAILY_API_LIMIT) {
    return { allowed: false, reason: `Daily limit reached (${DAILY_API_LIMIT})` }
  }
  
  // Check rate limit (requests per minute)
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const recentCount = recentRequests.filter(t => t > windowStart).length
  
  if (recentCount >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, reason: `Rate limit (${MAX_REQUESTS_PER_MINUTE}/min)` }
  }
  
  return { allowed: true }
}

function recordApiCall() {
  dailyApiCalls++
  recentRequests.push(Date.now())
  
  // Clean up old timestamps
  const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS
  while (recentRequests.length > 0 && recentRequests[0] < windowStart) {
    recentRequests.shift()
  }
}

async function enforceMinDelay() {
  const now = Date.now()
  const timeSinceLastResponse = now - lastResponseTime
  
  if (timeSinceLastResponse < MIN_RESPONSE_DELAY_MS) {
    const waitTime = MIN_RESPONSE_DELAY_MS - timeSinceLastResponse
    await new Promise(r => setTimeout(r, waitTime))
  }
  
  lastResponseTime = Date.now()
}

function isSpam(sender: string, text: string): boolean {
  // Check if sender is in known spam list
  if (SPAM_SENDERS.has(sender)) {
    return true
  }
  
  // Check if sender looks like a short code (5-6 digits)
  if (/^\d{5,6}$/.test(sender)) {
    return true
  }
  
  // Check text against spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return true
    }
  }
  
  return false
}

function logSpam(sender: string, text: string) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] FROM: ${sender}\nMESSAGE: ${text}\n${'─'.repeat(50)}\n`
  
  try {
    appendFileSync(SPAM_LOG_FILE, logEntry)
  } catch (e) {
    // Ignore write errors
  }
}

// ============================================
// AI FUNCTIONS
// ============================================

async function getClaudeResponse(history: Message[]): Promise<string> {
  if (!anthropic) throw new Error('Claude not configured')
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: history
  })
  
  return response.content[0].type === 'text' 
    ? response.content[0].text 
    : 'Hey! Got your message'
}

async function getGeminiResponse(history: Message[]): Promise<string> {
  if (!geminiModel) throw new Error('Gemini not configured')
  
  const historyText = history.map(m => 
    m.role === 'user' ? m.content : `Kyle: ${m.content}`
  ).join('\n')
  
  const prompt = `${SYSTEM_PROMPT}

Recent conversation:
${historyText}

Respond to the last message as Kyle. Reply ONLY with the message text, nothing else:`

  const result = await geminiModel.generateContent(prompt)
  return result.response.text().trim()
}

async function getAIResponse(chatId: string, senderName: string, message: string): Promise<{ text: string; provider: string }> {
  // Check if we can make an API call
  const { allowed, reason } = canMakeApiCall()
  if (!allowed) {
    rateLimited++
    throw new Error(`Rate limited: ${reason}`)
  }
  
  // Enforce minimum delay between responses
  await enforceMinDelay()
  
  // Get or create conversation history
  let history = conversationHistory.get(chatId) || []
  
  // Add new message
  history.push({ role: 'user', content: `${senderName}: ${message}` })
  
  // Keep only last N messages
  if (history.length > CONVERSATION_MEMORY) {
    history = history.slice(-CONVERSATION_MEMORY)
  }
  
  let responseText: string
  let provider: string
  
  // Try Claude first
  if (anthropic) {
    try {
      responseText = await getClaudeResponse(history)
      provider = 'Claude'
      claudeSuccesses++
      recordApiCall()
    } catch (error: any) {
      console.log(`   ⚠️  Claude failed: ${error.message}`)
      
      // Fallback to Gemini
      if (geminiModel) {
        try {
          responseText = await getGeminiResponse(history)
          provider = 'Gemini (fallback)'
          geminiFallbacks++
          recordApiCall()
        } catch (geminiError: any) {
          totalErrors++
          throw new Error(`Both AIs failed. Claude: ${error.message}, Gemini: ${geminiError.message}`)
        }
      } else {
        totalErrors++
        throw error
      }
    }
  } else if (geminiModel) {
    // Claude not configured, use Gemini directly
    responseText = await getGeminiResponse(history)
    provider = 'Gemini'
    geminiFallbacks++
    recordApiCall()
  } else {
    throw new Error('No AI provider configured')
  }
  
  // Update history with response
  history.push({ role: 'assistant', content: responseText })
  conversationHistory.set(chatId, history)
  
  return { text: responseText, provider }
}

function printStats() {
  const total = claudeSuccesses + geminiFallbacks
  console.log('\n📊 Session Stats:')
  console.log(`   API calls today: ${dailyApiCalls}/${DAILY_API_LIMIT}`)
  console.log(`   Claude: ${claudeSuccesses} | Gemini: ${geminiFallbacks} | Errors: ${totalErrors}`)
  console.log(`   Spam blocked: ${spamBlocked} | Rate limited: ${rateLimited}`)
  if (total > 0) {
    console.log(`   Claude success rate: ${((claudeSuccesses / total) * 100).toFixed(1)}%`)
  }
  if (spamBlocked > 0) {
    console.log(`   📝 Spam log: ${SPAM_LOG_FILE}`)
  }
}

// ============================================
// MAIN BOT
// ============================================

async function main() {
  console.log('🤖 AI-Powered iMessage Bot')
  console.log('━'.repeat(50))
  console.log(`🧠 Primary: ${anthropic ? 'Claude (Sonnet)' : 'Not configured'}`)
  console.log(`🔄 Backup:  ${geminiModel ? 'Gemini (Flash)' : 'Not configured'}`)
  console.log(`💬 Memory:  ${CONVERSATION_MEMORY} messages per chat`)
  console.log(`📝 Style:   Casual, friendly, funny`)
  console.log('━'.repeat(50))
  console.log(`💰 Cost Controls:`)
  console.log(`   Daily limit: ${DAILY_API_LIMIT} API calls`)
  console.log(`   Rate limit:  ${MAX_REQUESTS_PER_MINUTE}/minute`)
  console.log(`   Min delay:   ${MIN_RESPONSE_DELAY_MS/1000}s between responses`)
  console.log('━'.repeat(50))
  console.log(`🛡️  Spam Protection: ENABLED`)
  console.log(`   Auto-reply "STOP" to marketing spam`)
  console.log(`   Spam log: ${SPAM_LOG_FILE}`)
  console.log('━'.repeat(50))
  console.log('\nPress Ctrl+C to stop\n')

  const sdk = new IMessageSDK({
    debug: false,
    watcher: {
      pollInterval: 3000,  // Check every 3 seconds (saves resources)
      excludeOwnMessages: true,
      unreadOnly: false
    }
  })

  await sdk.startWatching({
    onDirectMessage: async (message) => {
      if (processedMessages.has(message.id)) return
      processedMessages.add(message.id)

      const sender = message.sender
      const text = message.text || ''
      const chatId = message.chatId || sender

      if (!text.trim()) {
        console.log(`📎 [${sender}] Attachment (skipping)`)
        return
      }

      console.log(`\n📨 From ${sender}:`)
      console.log(`   "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`)

      // Check for spam
      if (isSpam(sender, text)) {
        console.log('   🚫 SPAM DETECTED!')
        console.log('   📤 Replying: "STOP"')
        
        try {
          await sdk.send(sender, 'STOP')
          console.log('   ✅ Sent STOP')
          spamBlocked++
          logSpam(sender, text)
          console.log('   📝 Logged to spam-log.txt')
        } catch (e: any) {
          console.log(`   ❌ Failed to send STOP: ${e.message}`)
        }
        return
      }

      try {
        console.log('   🧠 Thinking...')
        const { text: reply, provider } = await getAIResponse(chatId, sender, text)

        console.log(`   🤖 [${provider}] "${reply}"`)

        await sdk.send(sender, reply)
        console.log(`   ✅ Sent! (${dailyApiCalls}/${DAILY_API_LIMIT} today)`)

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`)
      }

      // Cleanup
      if (processedMessages.size > 500) {
        const toDelete = Array.from(processedMessages).slice(0, 250)
        toDelete.forEach(id => processedMessages.delete(id))
      }
    },

    onGroupMessage: async (message) => {
      if (processedMessages.has(message.id)) return
      processedMessages.add(message.id)

      const sender = message.sender
      const text = message.text || ''
      const chatId = message.chatId || 'unknown-group'

      if (!text.trim()) return

      console.log(`\n👥 Group from ${sender}:`)
      console.log(`   "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`)

      // Only respond if mentioned or to questions
      const shouldRespond = text.toLowerCase().includes('kyle') || 
                           text.toLowerCase().includes('@kyle') ||
                           text.endsWith('?')

      if (!shouldRespond) {
        console.log('   ⏭️  Skipping (not addressed to Kyle)')
        return
      }

      // Check rate limits before responding to group
      const { allowed, reason } = canMakeApiCall()
      if (!allowed) {
        console.log(`   ⏸️  Skipping: ${reason}`)
        rateLimited++
        return
      }

      try {
        console.log('   🧠 Thinking...')
        const { text: reply, provider } = await getAIResponse(chatId, sender, text)

        console.log(`   🤖 [${provider}] "${reply}"`)

        await sdk.send(chatId, reply)
        console.log(`   ✅ Sent! (${dailyApiCalls}/${DAILY_API_LIMIT} today)`)

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`)
      }
    },

    onError: (error) => {
      console.error('\n❌ Watcher error:', error.message)
    }
  })

  console.log('✅ Bot is running! Waiting for messages...\n')

  // Graceful shutdown with stats
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...')
    printStats()
    sdk.stopWatching()
    await sdk.close()
    console.log('\n✅ Bot stopped. Goodbye!')
    process.exit(0)
  })
}

main().catch(console.error)
