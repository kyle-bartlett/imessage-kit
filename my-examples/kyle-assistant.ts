#!/usr/bin/env npx tsx
/**
 * Kyle's Personal AI Assistant v4
 *
 * Features:
 * - AI responds as Kyle to all messages
 * - Calendar awareness (Google Calendar)
 * - Auto-create calendar events from SMS invitations
 * - Smart content-based spam detection
 * - Urgency detection with Pushover/Lark alerts
 * - Self-text recap 3x/day
 * - Smart family group engagement
 * - Human-like randomized delays
 * - Remote control via text commands (!pause, !resume, !status, !digest)
 * - Smart double-response prevention (skips if Kyle already replied)
 *
 * Usage: npx tsx kyle-assistant.ts
 * Stop: Ctrl+C
 */

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { google } from 'googleapis'
import { IMessageSDK } from '../imessage-kit/dist/index.js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, readFileSync, existsSync } from 'fs'

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '.env') })

// ============================================
// CONFIGURATION
// ============================================
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const CONVERSATION_MEMORY = parseInt(process.env.CONVERSATION_MEMORY || '30')

// Self-text for recaps and alerts (YOUR phone number)
const SELF_PHONE_NUMBER = process.env.SELF_PHONE_NUMBER || ''

// Pushover settings (optional - for push notifications)
const PUSHOVER_USER_KEY = process.env.PUSHOVER_USER_KEY || ''
const PUSHOVER_APP_TOKEN = process.env.PUSHOVER_APP_TOKEN || ''

// Lark webhook (optional - for Lark notifications)
const LARK_WEBHOOK_URL = process.env.LARK_WEBHOOK_URL || ''

// Alert keywords
const ALERT_KEYWORDS = ['urgent', 'emergency', 'asap', 'help', 'important', 'need you', 'call me', '911', 'hospital', 'accident']

// Cost controls
const DAILY_API_LIMIT = parseInt(process.env.DAILY_API_LIMIT || '200')
const RATE_LIMIT_WINDOW_MS = 60000
const MAX_REQUESTS_PER_MINUTE = 15

// Human-like delay settings (milliseconds)
const MIN_RESPONSE_DELAY = 15000   // 15 seconds minimum
const MAX_RESPONSE_DELAY = 180000  // 3 minutes maximum
const TYPING_SPEED_MS_PER_CHAR = 50

// Recap schedule (hours in 24h format)
const RECAP_HOURS = [9, 14, 21]  // 9 AM, 2 PM, 9 PM
let lastRecapHour = -1

// ============================================
// FAMILY GROUP CHAT SETTINGS
// ============================================
// Add your family group chat names here (case-insensitive matching)
const FAMILY_GROUPS = [
  'bartlett family',
  'houston folks',
  // Add more group names as needed
]

// How often to engage in family groups (every X messages without being mentioned)
const FAMILY_GROUP_ENGAGE_EVERY = 8  // Respond every 8th message even if not mentioned

// Text-based emoji reactions for casual engagement
const CASUAL_EMOJI_RESPONSES = ['👍', '😂', '🙌', '💯', '🔥', '❤️', 'haha', 'nice!', 'lol']

// Track message counts per group for engagement timing
const groupMessageCounts: Map<string, number> = new Map()

// ============================================
// REMOTE CONTROL (text yourself commands)
// ============================================
// Text these commands to yourself to control the bot:
// !pause    - Pause AI responses (bot keeps logging)
// !resume   - Resume AI responses
// !status   - Get current status
// !digest   - Send immediate recap
// !help     - List commands

let botPaused = false
let pausedAt: Date | null = null

const REMOTE_COMMANDS: Record<string, string> = {
  '!pause': 'Pause AI responses',
  '!resume': 'Resume AI responses',
  '!status': 'Get current status',
  '!digest': 'Send immediate recap',
  '!help': 'List commands'
}

// ============================================
// DIGEST FILE PATHS
// ============================================
const DIGEST_FILE = resolve(__dirname, 'daily-digest.json')

// ============================================
// ALERT SYSTEM (Pushover, Lark, Self-text)
// ============================================
async function sendPushoverAlert(title: string, message: string) {
  if (!PUSHOVER_USER_KEY || !PUSHOVER_APP_TOKEN) return false

  try {
    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: PUSHOVER_APP_TOKEN,
        user: PUSHOVER_USER_KEY,
        title,
        message,
        priority: 1,  // High priority
        sound: 'siren'
      })
    })
    return response.ok
  } catch (e) {
    console.error('   Pushover error:', e)
    return false
  }
}

async function sendLarkAlert(title: string, message: string) {
  if (!LARK_WEBHOOK_URL) return false

  try {
    const response = await fetch(LARK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'text',
        content: { text: `🚨 ${title}\n\n${message}` }
      })
    })
    return response.ok
  } catch (e) {
    console.error('   Lark error:', e)
    return false
  }
}

async function sendSelfText(sdk: IMessageSDK, message: string) {
  if (!SELF_PHONE_NUMBER) return false

  try {
    await sdk.send(SELF_PHONE_NUMBER, message)
    return true
  } catch (e) {
    console.error('   Self-text error:', e)
    return false
  }
}

async function sendAlert(sdk: IMessageSDK, title: string, message: string) {
  let sent = false

  // Try all configured alert methods
  if (await sendPushoverAlert(title, message)) {
    console.log('   📱 Pushover alert sent')
    sent = true
  }

  if (await sendLarkAlert(title, message)) {
    console.log('   💬 Lark alert sent')
    sent = true
  }

  if (await sendSelfText(sdk, `🚨 ${title}\n\n${message}`)) {
    console.log('   📲 Self-text alert sent')
    sent = true
  }

  if (!sent) {
    console.log('   ⚠️  No alert method configured')
  }

  return sent
}

// ============================================
// REMOTE CONTROL HANDLER
// ============================================
async function handleRemoteCommand(sdk: IMessageSDK, command: string): Promise<boolean> {
  const cmd = command.toLowerCase().trim()

  switch (cmd) {
    case '!pause':
      if (botPaused) {
        await sendSelfText(sdk, '⏸️ Already paused')
      } else {
        botPaused = true
        pausedAt = new Date()
        await sendSelfText(sdk, '⏸️ Bot PAUSED\n\nAI responses disabled.\nMessages still being logged.\n\nText "!resume" to restart.')
        console.log('\n🔴 BOT PAUSED via remote command')
      }
      return true

    case '!resume':
      if (!botPaused) {
        await sendSelfText(sdk, '▶️ Already running')
      } else {
        const pauseDuration = pausedAt ? Math.round((Date.now() - pausedAt.getTime()) / 60000) : 0
        botPaused = false
        pausedAt = null
        await sendSelfText(sdk, `▶️ Bot RESUMED\n\nPaused for ${pauseDuration} min.\nAI responses re-enabled.`)
        console.log('\n🟢 BOT RESUMED via remote command')
      }
      return true

    case '!status':
      const status = botPaused ? '⏸️ PAUSED' : '🟢 ACTIVE'
      const pauseInfo = pausedAt ? `\nPaused since: ${pausedAt.toLocaleTimeString()}` : ''
      const statusMsg = `${status}\n━━━━━━━━━━━━━━━━━━━━\n📊 API calls: ${dailyApiCalls}/${DAILY_API_LIMIT}\n💬 Responses: ${totalResponses}\n🚨 Urgent alerts: ${urgentAlerts}\n📅 Calendar: ${calendarEnabled ? '✅' : '❌'}${pauseInfo}`
      await sendSelfText(sdk, statusMsg)
      return true

    case '!digest':
      const recap = generateDigestSummary()
      await sendSelfText(sdk, recap)
      console.log('\n📊 Digest sent via remote command')
      return true

    case '!help':
      let helpMsg = '🤖 Remote Commands:\n━━━━━━━━━━━━━━━━━━━━\n'
      for (const [c, desc] of Object.entries(REMOTE_COMMANDS)) {
        helpMsg += `${c} - ${desc}\n`
      }
      await sendSelfText(sdk, helpMsg)
      return true

    default:
      return false
  }
}

function isRemoteCommand(text: string): boolean {
  return text.trim().toLowerCase().startsWith('!')
}

// ============================================
// URGENCY DETECTION
// ============================================
interface UrgencyResult {
  isUrgent: boolean
  reason?: string
  confidence: 'low' | 'medium' | 'high'
}

function detectUrgency(text: string, sender: string): UrgencyResult {
  const lowerText = text.toLowerCase()

  for (const keyword of ALERT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return { isUrgent: true, reason: `Contains "${keyword}"`, confidence: 'high' }
    }
  }

  if (/[!?]{3,}/.test(text)) {
    return { isUrgent: true, reason: 'Multiple !!!???', confidence: 'medium' }
  }

  const words = text.split(' ')
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase())
  if (capsWords.length >= 3) {
    return { isUrgent: true, reason: 'ALL CAPS words', confidence: 'medium' }
  }

  return { isUrgent: false, confidence: 'low' }
}

// ============================================
// DAILY DIGEST
// ============================================
interface DigestEntry {
  timestamp: string
  sender: string
  preview: string
  wasUrgent: boolean
  aiResponded: boolean
  chatId: string
  isGroup: boolean
}

interface DailyDigest {
  date: string
  entries: DigestEntry[]
  stats: {
    totalMessages: number
    uniqueSenders: number
    urgentCount: number
    aiResponses: number
    groupMessages: number
    dmMessages: number
  }
}

function loadDigest(): DailyDigest {
  const today = new Date().toDateString()

  if (existsSync(DIGEST_FILE)) {
    try {
      const data = JSON.parse(readFileSync(DIGEST_FILE, 'utf-8'))
      if (data.date === today) return data
    } catch (e) { }
  }

  return {
    date: today,
    entries: [],
    stats: { totalMessages: 0, uniqueSenders: 0, urgentCount: 0, aiResponses: 0, groupMessages: 0, dmMessages: 0 }
  }
}

function saveDigest(digest: DailyDigest) {
  writeFileSync(DIGEST_FILE, JSON.stringify(digest, null, 2))
}

function addToDigest(sender: string, text: string, chatId: string, wasUrgent: boolean, aiResponded: boolean, isGroup: boolean) {
  const digest = loadDigest()

  digest.entries.push({
    timestamp: new Date().toISOString(),
    sender,
    preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    wasUrgent,
    aiResponded,
    chatId,
    isGroup
  })

  digest.stats.totalMessages++
  if (wasUrgent) digest.stats.urgentCount++
  if (aiResponded) digest.stats.aiResponses++
  if (isGroup) digest.stats.groupMessages++
  else digest.stats.dmMessages++

  const uniqueSenders = new Set(digest.entries.map(e => e.sender))
  digest.stats.uniqueSenders = uniqueSenders.size

  saveDigest(digest)
}

function generateDigestSummary(): string {
  const digest = loadDigest()

  if (digest.entries.length === 0) {
    return "📭 No messages received yet today."
  }

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  let summary = `📊 Message Recap (${timeStr})\n`
  summary += `━━━━━━━━━━━━━━━━━━━━\n\n`
  summary += `📬 Total: ${digest.stats.totalMessages}\n`
  summary += `💬 DMs: ${digest.stats.dmMessages} | 👥 Groups: ${digest.stats.groupMessages}\n`
  summary += `🤖 AI responded: ${digest.stats.aiResponses}\n`

  if (digest.stats.urgentCount > 0) {
    summary += `🚨 Urgent: ${digest.stats.urgentCount}\n`
  }

  summary += `\n👥 People (${digest.stats.uniqueSenders}):\n`

  // Group by sender
  const bySender: Map<string, DigestEntry[]> = new Map()
  digest.entries.forEach(e => {
    if (!bySender.has(e.sender)) bySender.set(e.sender, [])
    bySender.get(e.sender)!.push(e)
  })

  // Sort by message count
  const sorted = Array.from(bySender.entries()).sort((a, b) => b[1].length - a[1].length)

  sorted.slice(0, 10).forEach(([sender, entries]) => {
    const urgent = entries.some(e => e.wasUrgent) ? '🚨' : ''
    const shortSender = sender.length > 15 ? sender.substring(0, 12) + '...' : sender
    summary += `• ${shortSender}${urgent}: ${entries.length} msg\n`
  })

  if (sorted.length > 10) {
    summary += `  ...and ${sorted.length - 10} more\n`
  }

  return summary
}

async function checkAndSendScheduledRecap(sdk: IMessageSDK) {
  const now = new Date()
  const currentHour = now.getHours()

  // Check if we should send a recap
  if (RECAP_HOURS.includes(currentHour) && currentHour !== lastRecapHour) {
    lastRecapHour = currentHour

    const recap = generateDigestSummary()
    console.log('\n⏰ Sending scheduled recap...')

    if (await sendSelfText(sdk, recap)) {
      console.log('   ✅ Recap sent to self')
    }
  }
}

// ============================================
// FAMILY GROUP HANDLING
// ============================================
function isFamilyGroup(chatName: string | undefined): boolean {
  if (!chatName) return false
  const lowerName = chatName.toLowerCase()
  return FAMILY_GROUPS.some(fg => lowerName.includes(fg))
}

function shouldEngageInFamilyGroup(chatId: string, mentionedKyle: boolean): { engage: boolean; type: 'full' | 'emoji' | 'none' } {
  // Always engage if mentioned
  if (mentionedKyle) {
    groupMessageCounts.set(chatId, 0)  // Reset counter
    return { engage: true, type: 'full' }
  }

  // Increment message counter
  const count = (groupMessageCounts.get(chatId) || 0) + 1
  groupMessageCounts.set(chatId, count)

  // Every X messages, engage with emoji or short response
  if (count >= FAMILY_GROUP_ENGAGE_EVERY) {
    groupMessageCounts.set(chatId, 0)  // Reset counter

    // 70% chance emoji, 30% chance full response
    if (Math.random() < 0.7) {
      return { engage: true, type: 'emoji' }
    } else {
      return { engage: true, type: 'full' }
    }
  }

  return { engage: false, type: 'none' }
}

function getRandomEmojiResponse(): string {
  return CASUAL_EMOJI_RESPONSES[Math.floor(Math.random() * CASUAL_EMOJI_RESPONSES.length)]
}

// ============================================
// GOOGLE CALENDAR
// ============================================
const CREDENTIALS_PATH = resolve(__dirname, 'google-credentials.json')
const TOKEN_PATH = resolve(__dirname, 'google-token.json')

interface CalendarEvent {
  summary: string
  start: Date
  end: Date
  location?: string
}

let calendarEnabled = false
let todaysEvents: CalendarEvent[] = []
let calendarAuth: any = null

async function initCalendarAuth() {
  if (!existsSync(CREDENTIALS_PATH) || !existsSync(TOKEN_PATH)) {
    return null
  }

  try {
    const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'))
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'))
    const { client_id, client_secret } = credentials.installed || credentials.web

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3000/callback')
    oAuth2Client.setCredentials(token)

    return oAuth2Client
  } catch (e) {
    console.error('   Calendar auth error:', e)
    return null
  }
}

async function loadCalendarEvents(): Promise<CalendarEvent[]> {
  calendarAuth = await initCalendarAuth()

  if (!calendarAuth) {
    return []
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth: calendarAuth })

    // Get today's events
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 20
    })

    const events: CalendarEvent[] = (response.data.items || []).map(event => ({
      summary: event.summary || 'Untitled',
      start: new Date(event.start?.dateTime || event.start?.date || ''),
      end: new Date(event.end?.dateTime || event.end?.date || ''),
      location: event.location
    }))

    calendarEnabled = true
    console.log(`   📅 Loaded ${events.length} calendar events for today`)
    return events

  } catch (e: any) {
    console.error('   Calendar load error:', e.message)
    return []
  }
}

function getCalendarContext(): string {
  if (!calendarEnabled || todaysEvents.length === 0) {
    return "Calendar: No events today or not connected"
  }

  const now = new Date()
  const current = todaysEvents.find(e => e.start <= now && e.end > now)
  const upcoming = todaysEvents.filter(e => e.start > now)

  let context = "Kyle's schedule today:\n"

  if (current) {
    const endTime = current.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    context += `- NOW: ${current.summary} (until ${endTime})\n`
  }

  if (upcoming.length > 0) {
    upcoming.slice(0, 3).forEach(e => {
      const time = e.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      context += `- ${time}: ${e.summary}\n`
    })
  }

  if (!current && upcoming.length === 0) {
    context += "- No more events today\n"
  }

  return context
}

// Refresh calendar events periodically
async function refreshCalendar() {
  if (calendarAuth) {
    todaysEvents = await loadCalendarEvents()
  }
}

// ============================================
// AUTO-CREATE CALENDAR EVENTS FROM MESSAGES
// ============================================

interface ParsedEventInvite {
  title: string
  dateTime: Date | null
  link: string | null
  source: string  // e.g., "9x", "Eventbrite"
}

// Patterns to detect event invitations
const EVENT_INVITE_PATTERNS = [
  /invited\s+you\s+to\s+(.+?)(?:\.|$)/i,
  /(.+?)\s+is\s+starting\s+on\s+(\w+),?\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
  /you're\s+registered\s+for\s+(.+?)(?:\.|$)/i,
  /reminder:\s*(.+?)\s+(?:starts?|begins?)/i,
]

// Parse date/time from message text
function parseEventDateTime(text: string): Date | null {
  const now = new Date()

  // Pattern: "Wednesday, 11:00 AM CDT" or "Thursday, 10:00 AM CST"
  const dayTimeMatch = text.match(/(?:on\s+)?(\w+day),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*(\w{2,4})?/i)
  if (dayTimeMatch) {
    const [_, dayName, hours, minutes, ampm, tz] = dayTimeMatch
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const targetDay = days.indexOf(dayName.toLowerCase())

    if (targetDay >= 0) {
      // Find next occurrence of this day
      const eventDate = new Date(now)
      const currentDay = now.getDay()
      let daysUntil = targetDay - currentDay
      if (daysUntil <= 0) daysUntil += 7  // Next week if today or past

      eventDate.setDate(eventDate.getDate() + daysUntil)

      // Set time
      let hour = parseInt(hours)
      if (ampm?.toUpperCase() === 'PM' && hour !== 12) hour += 12
      if (ampm?.toUpperCase() === 'AM' && hour === 12) hour = 0

      eventDate.setHours(hour, parseInt(minutes), 0, 0)
      return eventDate
    }
  }

  // Pattern: "Starting NOW" - return current time
  if (/starting\s+now/i.test(text)) {
    return now
  }

  return null
}

// Extract event link from message
function extractEventLink(text: string): string | null {
  // Look for common event platform links (including short URLs like o.lu.ma)
  const linkPatterns = [
    /(https?:\/\/[^\s]+(?:lu\.ma|eventbrite|zoom|meet\.google|calendly|hopin)[^\s]*)/i,
    /([a-z]+\.lu\.ma\/[^\s]+)/i,  // Short lu.ma links
  ]

  for (const pattern of linkPatterns) {
    const match = text.match(pattern)
    if (match) {
      let link = match[1]
      // Clean up trailing punctuation
      link = link.replace(/[.,;:!?)]+$/, '')
      // Ensure https://
      if (!link.startsWith('http')) link = 'https://' + link
      return link
    }
  }

  // Generic link extraction
  const genericLink = text.match(/https?:\/\/[^\s]+/i)
  if (genericLink) {
    return genericLink[0].replace(/[.,;:!?)]+$/, '')
  }

  return null
}

// Parse event invitation from message
function parseEventInvite(text: string, sender: string): ParsedEventInvite | null {
  // Check if it looks like an event invitation
  const isEventInvite = LEGIT_INDICATORS.some(p =>
    p.test(text) && (/invited|starting|rsvp|event|webinar|hackathon/i.test(text))
  )

  if (!isEventInvite) return null

  // Extract title
  let title = 'Event from ' + sender
  const titleMatch = text.match(/invited\s+you\s+to\s+(.+?)(?:\.\s|RSVP|Event|$)/i)
  if (titleMatch) {
    title = titleMatch[1].trim()
  } else {
    const startingMatch = text.match(/(.+?)\s+is\s+starting/i)
    if (startingMatch) {
      title = startingMatch[1].trim()
    }
  }

  // Clean up title
  title = title.replace(/[:.]$/, '').substring(0, 100)

  return {
    title,
    dateTime: parseEventDateTime(text),
    link: extractEventLink(text),
    source: sender
  }
}

// Create event in Google Calendar
async function createCalendarEvent(event: ParsedEventInvite): Promise<boolean> {
  if (!calendarAuth || !event.dateTime) {
    return false
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth: calendarAuth })

    // Event duration: default 1 hour
    const endTime = new Date(event.dateTime)
    endTime.setHours(endTime.getHours() + 1)

    const calendarEvent = {
      summary: event.title,
      description: event.link ? `Link: ${event.link}\n\nAuto-added from SMS (${event.source})` : `Auto-added from SMS (${event.source})`,
      start: {
        dateTime: event.dateTime.toISOString(),
        timeZone: 'America/Chicago',  // CST/CDT
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/Chicago',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
        ],
      },
    }

    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: calendarEvent,
    })

    return true
  } catch (e: any) {
    console.error('   Calendar create error:', e.message)
    return false
  }
}

// Track created events to avoid duplicates
const createdEventKeys = new Set<string>()

function getEventKey(event: ParsedEventInvite): string {
  return `${event.title}-${event.dateTime?.toISOString() || 'nodate'}`
}

// ============================================
// KYLE'S PERSONALITY
// ============================================
const KYLE_SYSTEM_PROMPT = `You ARE Kyle. You're responding to iMessages from friends and family.

## Your Personality:
- Warm, genuine, care about people
- Casual and relaxed - never formal
- Use emojis naturally: 😂 👍 🙌 💪 🔥 ❤️
- Witty, enjoy playful banter
- Keep texts brief (1-3 sentences usually)
- Match the other person's energy

## Your Texting Style:
- Start lowercase sometimes for casual feel
- Use "haha" or "lol" naturally
- Abbreviations fine: gonna, wanna, idk, tbh
- Don't over-explain
- Ask follow-up questions to show you care

## NEVER:
- Sound like customer service
- Use "I hope this helps!" type phrases
- Be overly formal
- Mention you're an AI
- Add "!" to everything

## For scheduling/plans:
- Be noncommittal if unsure: "let me check"
- If message doesn't need response: just "👍" or "got it"

## Calendar Context:
{CALENDAR_CONTEXT}

You ARE Kyle texting YOUR friends and family.`

// ============================================
// AI RESPONSE
// ============================================
interface Message {
  role: 'user' | 'assistant'
  content: string
}

const conversationHistory: Map<string, Message[]> = new Map()
const processedMessages = new Set<string>()

let dailyApiCalls = 0
let dailyResetDate = new Date().toDateString()
const recentRequests: number[] = []

let totalResponses = 0
let urgentAlerts = 0

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null
const geminiModel = genAI?.getGenerativeModel({ model: 'gemini-1.5-flash' })

function resetDailyCounterIfNeeded() {
  const today = new Date().toDateString()
  if (today !== dailyResetDate) {
    dailyApiCalls = 0
    dailyResetDate = today
    groupMessageCounts.clear()
    console.log('\n📅 New day - counters reset')
  }
}

function canMakeApiCall(): { allowed: boolean; reason?: string } {
  resetDailyCounterIfNeeded()

  if (dailyApiCalls >= DAILY_API_LIMIT) {
    return { allowed: false, reason: `Daily limit (${DAILY_API_LIMIT})` }
  }

  const now = Date.now()
  const recentCount = recentRequests.filter(t => t > now - RATE_LIMIT_WINDOW_MS).length

  if (recentCount >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, reason: `Rate limit (${MAX_REQUESTS_PER_MINUTE}/min)` }
  }

  return { allowed: true }
}

function recordApiCall() {
  dailyApiCalls++
  recentRequests.push(Date.now())

  while (recentRequests.length > 0 && recentRequests[0] < Date.now() - RATE_LIMIT_WINDOW_MS) {
    recentRequests.shift()
  }
}

async function getAIResponse(chatId: string, senderName: string, message: string, isGroup: boolean): Promise<string> {
  const { allowed, reason } = canMakeApiCall()
  if (!allowed) throw new Error(`Rate limited: ${reason}`)

  let history = conversationHistory.get(chatId) || []
  const userMessage = isGroup ? `[${senderName}]: ${message}` : message
  history.push({ role: 'user', content: userMessage })

  if (history.length > CONVERSATION_MEMORY) {
    history = history.slice(-CONVERSATION_MEMORY)
  }

  const calendarContext = getCalendarContext()
  const systemPrompt = KYLE_SYSTEM_PROMPT.replace('{CALENDAR_CONTEXT}', calendarContext)

  let responseText: string

  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: systemPrompt,
        messages: history
      })

      responseText = response.content[0].type === 'text' ? response.content[0].text : '👍'
      recordApiCall()
    } catch (error: any) {
      if (geminiModel) {
        const historyText = history.map(m => m.role === 'user' ? m.content : `Kyle: ${m.content}`).join('\n')
        const prompt = `${systemPrompt}\n\nConversation:\n${historyText}\n\nRespond as Kyle (brief):`
        const result = await geminiModel.generateContent(prompt)
        responseText = result.response.text().trim()
        recordApiCall()
      } else {
        throw error
      }
    }
  } else if (geminiModel) {
    const historyText = history.map(m => m.role === 'user' ? m.content : `Kyle: ${m.content}`).join('\n')
    const prompt = `${systemPrompt}\n\nConversation:\n${historyText}\n\nRespond as Kyle (brief):`
    const result = await geminiModel.generateContent(prompt)
    responseText = result.response.text().trim()
    recordApiCall()
  } else {
    throw new Error('No AI configured')
  }

  history.push({ role: 'assistant', content: responseText })
  conversationHistory.set(chatId, history)

  return responseText
}

// ============================================
// HUMAN-LIKE DELAYS
// ============================================
function getHumanDelay(responseLength: number): number {
  const baseDelay = MIN_RESPONSE_DELAY + Math.random() * (MAX_RESPONSE_DELAY - MIN_RESPONSE_DELAY)
  const typingTime = responseLength * TYPING_SPEED_MS_PER_CHAR * (0.5 + Math.random())
  return Math.min(baseDelay + typingTime, MAX_RESPONSE_DELAY)
}

async function humanDelay(responseLength: number, short: boolean = false) {
  let delay = short ? 3000 + Math.random() * 5000 : getHumanDelay(responseLength)
  const seconds = Math.round(delay / 1000)
  console.log(`   ⏳ Waiting ${seconds}s...`)
  await new Promise(r => setTimeout(r, delay))
}

// ============================================
// SMART SPAM DETECTION (Content-Based)
// ============================================

// SPAM indicators - things that scam/marketing messages say
const SPAM_INDICATORS = [
  // Prize/money scams
  /free\s+\$\d+/i,                    // "free $250"
  /you('ve|r)?\s*(have\s+)?won/i,     // "you've won", "you won"
  /claim\s+(your\s+)?(reward|prize|gift)/i,
  /congratulations.*winner/i,

  // Urgency scams
  /act\s+now/i,
  /limited\s+time/i,
  /expires?\s+(today|soon|in\s+\d+)/i,
  /last\s+chance/i,
  /don't\s+miss\s+out/i,

  // Survey/phishing
  /take\s+a\s+(quick\s+)?(\d+[- ]?min(ute)?\s+)?survey/i,
  /verify\s+your\s+(account|identity)/i,
  /confirm\s+your\s+(identity|ssn|social)/i,
  /your\s+account\s+(has\s+been|is|will\s+be)\s+(suspended|locked|closed)/i,

  // Medical/insurance spam
  /medical\s+kit/i,
  /free\s+(health|medical|insurance)/i,
  /medicare\s+(benefit|plan|savings)/i,

  // Loan/debt scams
  /pre-?approved\s+(for\s+)?\$?\d+/i,
  /debt\s+(relief|forgiveness|consolidation)/i,
  /student\s+loan\s+forgiveness/i,

  // Generic spam patterns
  /\bunsubscribe\b/i,
  /\breply\s+stop\b/i,
  /msg\s*&?\s*data\s*rates/i,
  /text\s+stop\s+to\s+(opt[- ]?out|cancel|end)/i,
  /click\s+(here|now|the\s+link)/i,
]

// LEGITIMATE indicators - things real notifications say
const LEGIT_INDICATORS = [
  // Event/calendar
  /invited\s+you\s+to/i,              // "invited you to Building an AI-First..."
  /rsvp/i,                            // RSVP links
  /is\s+starting\s+(on|in|at)/i,      // "is starting on Wednesday"
  /event\s*[-–]\s*/i,                 // "Event - "
  /webinar/i,
  /hackathon/i,
  /conference/i,
  /workshop/i,
  /meeting\s+(is\s+)?starting/i,

  // Known legitimate domains in links
  /lu\.ma\//i,                        // lu.ma event links
  /eventbrite\./i,
  /zoom\.(us|com)/i,
  /meet\.google/i,
  /calendly\./i,
  /hopin\./i,
  /airmeet\./i,

  // Appointment confirmations
  /appointment\s+(confirmed|scheduled|reminder)/i,
  /your\s+(order|package|delivery)/i,
  /verification\s+code/i,             // 2FA codes
  /one[- ]?time\s+(code|password|pin)/i,

  // Shipping/delivery
  /shipped|tracking|delivered/i,
  /out\s+for\s+delivery/i,
]

interface SpamAnalysis {
  isSpam: boolean
  spamScore: number
  legitScore: number
}

function analyzeSpam(sender: string, text: string): SpamAnalysis {
  // Count spam vs legit indicators
  let spamScore = 0
  let legitScore = 0

  // Check spam patterns
  for (const pattern of SPAM_INDICATORS) {
    if (pattern.test(text)) {
      spamScore++
    }
  }

  // Check legit patterns
  for (const pattern of LEGIT_INDICATORS) {
    if (pattern.test(text)) {
      legitScore++
    }
  }

  let isSpam = false

  // If it has legit indicators and no spam indicators, it's probably fine
  if (legitScore > 0 && spamScore === 0) {
    isSpam = false
  }
  // If it has spam indicators and no legit indicators, it's spam
  else if (spamScore > 0 && legitScore === 0) {
    isSpam = true
  }
  // If both or neither, use threshold: more spam than legit = spam
  else if (spamScore > legitScore) {
    isSpam = true
  }
  // Suspicious link patterns (scam domains often have random strings)
  else if (/https?:\/\/[a-z0-9]{8,}\.(com|net|org|info)\/[a-z0-9]{3}/i.test(text)) {
    // But not if it has legit indicators
    if (legitScore === 0) {
      isSpam = true
    }
  }

  return { isSpam, spamScore, legitScore }
}

// ============================================
// SMART DOUBLE-RESPONSE PREVENTION
// ============================================
// Check if Kyle already replied using getMessages with proper filter
async function kyleAlreadyReplied(sdk: IMessageSDK, chatId: string, sinceTimestamp: number): Promise<boolean> {
  try {
    // Get recent messages from this chat (including own messages!)
    const result = await sdk.getMessages({
      chatId,
      since: new Date(sinceTimestamp),
      excludeOwnMessages: false,  // We need to see Kyle's messages
      limit: 10
    })

    // Check if any message from Kyle (isFromMe = true) was sent after processing started
    for (const msg of result.messages) {
      if (msg.isFromMe) {
        return true  // Kyle already replied!
      }
    }
    return false
  } catch (e) {
    // If we can't check, proceed with response (safer than blocking)
    return false
  }
}

// ============================================
// MAIN BOT
// ============================================
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║            KYLE\'S PERSONAL AI ASSISTANT v4                   ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log(`║ 🧠 AI: ${anthropic ? 'Claude' : '—'} | ${geminiModel ? 'Gemini' : '—'}`)
  console.log(`║ 📅 Calendar: ${calendarEnabled ? '✅ (read+write)' : '❌ (run setup-google-calendar.ts)'}`)
  console.log(`║ 📱 Self-text: ${SELF_PHONE_NUMBER ? '✅ ' + SELF_PHONE_NUMBER : '❌ (set SELF_PHONE_NUMBER)'}`)
  console.log(`║ 🔔 Pushover: ${PUSHOVER_USER_KEY ? '✅' : '❌'}`)
  console.log(`║ 💬 Lark: ${LARK_WEBHOOK_URL ? '✅' : '❌'}`)
  console.log(`║ ⏰ Recaps: ${RECAP_HOURS.map(h => h > 12 ? (h-12)+'pm' : h+'am').join(', ')}`)
  console.log(`║ 👨‍👩‍👧‍👦 Family groups: ${FAMILY_GROUPS.join(', ')}`)
  console.log(`║ 💰 Daily limit: ${DAILY_API_LIMIT}`)
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log('║ 🎮 REMOTE: !pause !resume !status !digest !help              ║')
  console.log('║ 📅 AUTO-EVENTS: Event invites → Calendar (with confirmation) ║')
  console.log('║ 🚫 SMART SPAM: Content-based detection (not just sender)     ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log('\nPress Ctrl+C to stop and see final digest\n')

  todaysEvents = await loadCalendarEvents()

  const sdk = new IMessageSDK({
    debug: false,
    watcher: {
      pollInterval: 5000,
      excludeOwnMessages: true,
      unreadOnly: false
    }
  })

  // Check for scheduled recaps every minute
  setInterval(() => checkAndSendScheduledRecap(sdk), 60000)

  // Refresh calendar every 15 minutes
  setInterval(() => refreshCalendar(), 15 * 60 * 1000)

  await sdk.startWatching({
    // ============================================
    // DIRECT MESSAGE HANDLER
    // ============================================
    onDirectMessage: async (message) => {
      if (processedMessages.has(message.id)) return
      processedMessages.add(message.id)

      const sender = message.sender
      const text = message.text || ''
      const chatId = message.chatId || sender

      // ============================================
      // SELF-MESSAGE HANDLING
      // ============================================
      // Messages from yourself (your own phone number)
      if (SELF_PHONE_NUMBER && sender === SELF_PHONE_NUMBER) {
        // Check for remote commands
        if (isRemoteCommand(text)) {
          console.log(`\n🎮 Remote command: ${text}`)
          const handled = await handleRemoteCommand(sdk, text)
          if (handled) return
        }
        // Otherwise, IGNORE all messages from self (prevents infinite loop!)
        console.log(`   🔄 Self-message - ignoring (prevents loop)`)
        return
      }

      if (!text.trim()) {
        console.log(`📎 [${sender}] Attachment`)
        addToDigest(sender, '[Attachment]', chatId, false, false, false)
        return
      }

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`📨 DM from ${sender}`)
      console.log(`   "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`)

      const spamResult = analyzeSpam(sender, text)
      if (spamResult.isSpam) {
        console.log(`   🚫 SPAM detected (score: ${spamResult.spamScore} spam, ${spamResult.legitScore} legit)`)
        return
      }

      // ============================================
      // AUTO-CREATE CALENDAR EVENT FROM INVITATIONS
      // ============================================
      const eventInvite = parseEventInvite(text, sender)
      if (eventInvite) {
        const eventKey = getEventKey(eventInvite)

        // Avoid duplicate events
        if (!createdEventKeys.has(eventKey)) {
          console.log(`   📅 Event detected: "${eventInvite.title}"`)

          if (eventInvite.dateTime) {
            console.log(`      📆 ${eventInvite.dateTime.toLocaleString()}`)

            if (await createCalendarEvent(eventInvite)) {
              createdEventKeys.add(eventKey)
              console.log(`      ✅ Added to calendar!`)

              // Send confirmation to self
              if (SELF_PHONE_NUMBER) {
                await sendSelfText(sdk, `📅 Auto-added event:\n\n${eventInvite.title}\n${eventInvite.dateTime.toLocaleString()}\n${eventInvite.link || ''}`)
              }
            } else {
              console.log(`      ⚠️  Could not add to calendar (auth?)`)
            }
          } else {
            console.log(`      ⚠️  No date/time found - skipping calendar`)
          }
        } else {
          console.log(`   📅 Event already added: "${eventInvite.title}"`)
        }

        // Don't respond to automated event messages
        addToDigest(sender, text, chatId, false, false, false)
        return
      }

      const urgency = detectUrgency(text, sender)
      if (urgency.isUrgent) {
        console.log(`   🚨 URGENT: ${urgency.reason}`)
        await sendAlert(sdk, `Urgent from ${sender}`, `"${text.substring(0, 200)}"`)
        urgentAlerts++
      }

      // ============================================
      // CHECK IF BOT IS PAUSED
      // ============================================
      if (botPaused) {
        console.log('   ⏸️  Bot paused - logging only')
        addToDigest(sender, text, chatId, urgency.isUrgent, false, false)
        return
      }

      // Record when we started processing this message
      const processingStartTime = Date.now()

      try {
        console.log('   🧠 Thinking...')
        const reply = await getAIResponse(chatId, sender, text, false)

        await humanDelay(reply.length)

        // ============================================
        // SMART CHECK: Did Kyle already reply?
        // ============================================
        if (await kyleAlreadyReplied(sdk, chatId, processingStartTime)) {
          console.log('   👤 Kyle already replied - skipping AI response')
          addToDigest(sender, text, chatId, urgency.isUrgent, false, false)
          return
        }

        console.log(`   💬 "${reply}"`)
        await sdk.send(sender, reply)
        console.log(`   ✅ Sent (${dailyApiCalls}/${DAILY_API_LIMIT})`)

        totalResponses++
        addToDigest(sender, text, chatId, urgency.isUrgent, true, false)

      } catch (error: any) {
        console.error(`   ❌ ${error.message}`)
        addToDigest(sender, text, chatId, urgency.isUrgent, false, false)
      }

      if (processedMessages.size > 1000) {
        Array.from(processedMessages).slice(0, 500).forEach(id => processedMessages.delete(id))
      }
    },

    // ============================================
    // GROUP MESSAGE HANDLER
    // ============================================
    onGroupMessage: async (message) => {
      if (processedMessages.has(message.id)) return
      processedMessages.add(message.id)

      const sender = message.sender
      const text = message.text || ''
      const chatId = message.chatId || 'unknown-group'
      const chatName = (message as any).chatName || chatId

      if (!text.trim()) return

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`👥 [${chatName}] from ${sender}`)
      console.log(`   "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`)

      const urgency = detectUrgency(text, sender)
      if (urgency.isUrgent) {
        console.log(`   🚨 URGENT in group: ${urgency.reason}`)
        await sendAlert(sdk, `Urgent in ${chatName}`, `From ${sender}: "${text.substring(0, 200)}"`)
        urgentAlerts++
      }

      // Check if Kyle is mentioned
      const mentionedKyle = text.toLowerCase().includes('kyle') || text.toLowerCase().includes('@kyle')
      const isQuestion = text.endsWith('?') && text.length < 120

      // Determine engagement type
      let shouldEngage = false
      let engageType: 'full' | 'emoji' | 'none' = 'none'

      if (isFamilyGroup(chatName)) {
        // Special handling for family groups
        const result = shouldEngageInFamilyGroup(chatId, mentionedKyle || isQuestion)
        shouldEngage = result.engage
        engageType = result.type
        if (shouldEngage) {
          console.log(`   👨‍👩‍👧‍👦 Family group - engaging (${engageType})`)
        }
      } else {
        // Regular groups - only respond if mentioned or question
        shouldEngage = mentionedKyle || isQuestion || urgency.isUrgent
        engageType = shouldEngage ? 'full' : 'none'
      }

      if (!shouldEngage) {
        console.log('   ⏭️  Logging only')
        addToDigest(sender, text, chatId, urgency.isUrgent, false, true)
        return
      }

      // Check if bot is paused
      if (botPaused) {
        console.log('   ⏸️  Bot paused - logging only')
        addToDigest(sender, text, chatId, urgency.isUrgent, false, true)
        return
      }

      const { allowed, reason } = canMakeApiCall()
      if (!allowed && engageType === 'full') {
        console.log(`   ⏸️  ${reason}`)
        addToDigest(sender, text, chatId, urgency.isUrgent, false, true)
        return
      }

      // Record when we started processing this message
      const processingStartTime = Date.now()

      try {
        let reply: string

        if (engageType === 'emoji') {
          // Just send a casual emoji/reaction as text
          reply = getRandomEmojiResponse()
          await humanDelay(reply.length, true)  // Short delay for emoji
        } else {
          // Full AI response
          console.log('   🧠 Thinking...')
          reply = await getAIResponse(chatId, sender, text, true)
          await humanDelay(reply.length)
        }

        // Smart check: Did Kyle already reply?
        if (await kyleAlreadyReplied(sdk, chatId, processingStartTime)) {
          console.log('   👤 Kyle already replied - skipping AI response')
          addToDigest(sender, text, chatId, urgency.isUrgent, false, true)
          return
        }

        console.log(`   💬 "${reply}"`)
        await sdk.send(chatId, reply)
        console.log(`   ✅ Sent`)

        totalResponses++
        addToDigest(sender, text, chatId, urgency.isUrgent, true, true)

      } catch (error: any) {
        console.error(`   ❌ ${error.message}`)
        addToDigest(sender, text, chatId, urgency.isUrgent, false, true)
      }
    },

    onError: (error) => {
      console.error('\n❌ Error:', error.message)
    }
  })

  console.log('✅ Kyle Assistant is running!\n')

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...')
    console.log('\n' + generateDigestSummary())
    console.log('\n📊 Session:')
    console.log(`   Responses: ${totalResponses}`)
    console.log(`   Urgent alerts: ${urgentAlerts}`)
    console.log(`   API calls: ${dailyApiCalls}/${DAILY_API_LIMIT}`)

    sdk.stopWatching()
    await sdk.close()
    console.log('\n✅ Goodbye!')
    process.exit(0)
  })
}

main().catch(console.error)
