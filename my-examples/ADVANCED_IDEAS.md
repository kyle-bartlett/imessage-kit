# 🚀 Advanced Ideas & Use Cases

Fun and practical things you can build with iMessage Kit!

## 🤖 Bot Ideas

### 1. Out of Office Auto-Responder
Auto-reply when you're busy/away:

```typescript
const sdk = new IMessageSDK({ watcher: { excludeOwnMessages: true } })

const isWorkingHours = () => {
  const hour = new Date().getHours()
  return hour >= 9 && hour < 17
}

await sdk.startWatching({
  onDirectMessage: async (msg) => {
    if (!isWorkingHours()) {
      await sdk.send(msg.sender,
        "Hey! I'm away right now but I'll get back to you tomorrow 👍"
      )
    }
  }
})
```

### 2. Keyword Alerts
Get notified when someone mentions specific keywords:

```typescript
const ALERT_KEYWORDS = ['urgent', 'emergency', 'asap']

sdk.on('new-message', async (msg) => {
  const text = msg.text?.toLowerCase() || ''

  for (const keyword of ALERT_KEYWORDS) {
    if (text.includes(keyword)) {
      // Send yourself an alert via another channel
      console.log(`🚨 URGENT MESSAGE from ${msg.sender}: ${msg.text}`)
      // Could also send email, push notification, etc.
    }
  }
})
```

### 3. Smart Auto-Reply with Context
Remember previous conversations:

```typescript
const conversationState = new Map()

sdk.on('new-message', async (msg) => {
  const state = conversationState.get(msg.sender) || {}
  const text = msg.text?.toLowerCase() || ''

  if (text.includes('lunch')) {
    conversationState.set(msg.sender, { topic: 'lunch' })
    await sdk.send(msg.sender, 'Lunch sounds great! Where?')
  } else if (state.topic === 'lunch' && text.includes('when')) {
    await sdk.send(msg.sender, 'How about 12:30?')
  }
})
```

### 4. Message Scheduler
Schedule messages to send later:

```typescript
interface ScheduledMessage {
  to: string
  message: string
  sendAt: Date
}

const scheduled: ScheduledMessage[] = [
  {
    to: '+1234567890',
    message: 'Happy Birthday! 🎂',
    sendAt: new Date('2025-12-25T09:00:00')
  }
]

setInterval(async () => {
  const now = new Date()
  for (const msg of scheduled) {
    if (msg.sendAt <= now) {
      await sdk.send(msg.to, msg.message)
      // Remove from scheduled
    }
  }
}, 60000) // Check every minute
```

## 📊 Analytics & Insights

### 5. Daily Message Summary
Get a daily report:

```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)

const messages = await sdk.getMessages({ since: today })

const summary = {
  total: messages.total,
  unread: messages.unreadCount,
  topSenders: /* calculate */
}

// Email yourself the summary
console.log('Today:', summary)
```

### 6. Conversation Backup
Export all messages with someone:

```typescript
import { writeFileSync } from 'fs'

const messages = await sdk.getMessages({
  sender: '+1234567890',
  limit: 10000
})

const backup = messages.messages.map(m => ({
  date: m.date,
  from: m.isFromMe ? 'You' : m.sender,
  text: m.text
}))

writeFileSync('backup.json', JSON.stringify(backup, null, 2))
```

### 7. Find Shared Photos
Find all photos exchanged with someone:

```typescript
import { isImageAttachment } from '@photon-ai/imessage-kit'

const messages = await sdk.getMessages({
  sender: '+1234567890',
  hasAttachments: true,
  limit: 1000
})

const photos = []
for (const msg of messages.messages) {
  for (const att of msg.attachments) {
    if (isImageAttachment(att)) {
      photos.push({
        date: msg.date,
        filename: att.filename,
        path: att.transferName
      })
    }
  }
}

console.log(`Found ${photos.length} photos!`)
```

## 🎮 Fun Stuff

### 8. Random Quote Sender
Send random motivational quotes:

```typescript
const quotes = [
  "You're doing great!",
  "Keep being awesome!",
  "Today is your day!"
]

// Send random quote daily
setInterval(async () => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)]
  await sdk.send('+1234567890', quote)
}, 86400000) // Once per day
```

### 9. Birthday Reminder Bot
Auto-congratulate on birthdays:

```typescript
const birthdays = {
  '+1234567890': { name: 'John', date: '05-15' },
  '+0987654321': { name: 'Jane', date: '08-20' }
}

// Check daily
setInterval(async () => {
  const today = new Date()
  const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  for (const [phone, info] of Object.entries(birthdays)) {
    if (info.date === todayStr) {
      await sdk.send(phone, `Happy Birthday ${info.name}! 🎉🎂`)
    }
  }
}, 86400000) // Once per day
```

### 10. Group Message Analyzer
Track group chat activity:

```typescript
const chats = await sdk.listChats({ type: 'group' })

for (const chat of chats) {
  const messages = await sdk.getMessages({
    chatGuid: chat.chatId,
    limit: 1000
  })

  console.log(`${chat.displayName}:`)
  console.log(`  Messages: ${messages.total}`)
  // Calculate most active member, etc.
}
```

## 🔧 Utilities

### 11. Bulk Image Downloader
Download all images from all chats:

```typescript
import { downloadAttachment, isImageAttachment } from '@photon-ai/imessage-kit'

const chats = await sdk.listChats({ limit: 50 })

for (const chat of chats) {
  const messages = await sdk.getMessages({
    chatGuid: chat.chatId,
    hasAttachments: true
  })

  for (const msg of messages.messages) {
    for (const att of msg.attachments) {
      if (isImageAttachment(att)) {
        const dir = `/Users/kylebartlett/Downloads/${chat.displayName}`
        // Download to organized folders
      }
    }
  }
}
```

### 12. Message Export to CSV
Export for spreadsheet analysis:

```typescript
import { writeFileSync } from 'fs'

const messages = await sdk.getMessages({ limit: 5000 })

const csv = ['Date,Sender,Message,Is From Me']
  .concat(
    messages.messages.map(m =>
      `${m.date.toISOString()},${m.sender},"${m.text}",${m.isFromMe}`
    )
  )
  .join('\n')

writeFileSync('messages.csv', csv)
```

### 13. Duplicate Message Detector
Find repeated messages:

```typescript
const messages = await sdk.getMessages({ limit: 1000 })
const textCounts = new Map()

messages.messages.forEach(m => {
  if (m.text) {
    textCounts.set(m.text, (textCounts.get(m.text) || 0) + 1)
  }
})

// Find most repeated message
const duplicates = Array.from(textCounts.entries())
  .filter(([_, count]) => count > 1)
  .sort((a, b) => b[1] - a[1])

console.log('Most repeated:', duplicates[0])
```

## 🎯 Integration Ideas

### 14. Webhook Bridge
Forward messages to other services:

```typescript
const sdk = new IMessageSDK({
  webhook: {
    url: 'https://your-server.com/webhook',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  }
})

await sdk.startWatching()
// Now all new messages POST to your webhook
```

### 15. Email to iMessage
Convert emails to texts:

```typescript
// Monitor email inbox (use email library)
// When new email arrives:
async function emailReceived(from: string, subject: string) {
  await sdk.send('+1234567890',
    `📧 Email from ${from}: ${subject}`
  )
}
```

## 💡 Advanced Techniques

### 16. Smart Rate Limiting
Avoid overwhelming people:

```typescript
const rateLimits = new Map<string, number>()

async function sendWithRateLimit(to: string, message: string) {
  const lastSent = rateLimits.get(to) || 0
  const now = Date.now()

  if (now - lastSent < 60000) { // 1 minute cooldown
    console.log('Rate limited, skipping...')
    return
  }

  await sdk.send(to, message)
  rateLimits.set(to, now)
}
```

### 17. Conversation Threading
Track conversation flows:

```typescript
interface Conversation {
  messages: Message[]
  lastActivity: Date
  topic?: string
}

const conversations = new Map<string, Conversation>()

sdk.on('new-message', (msg) => {
  const conv = conversations.get(msg.sender) || {
    messages: [],
    lastActivity: new Date()
  }

  conv.messages.push(msg)
  conv.lastActivity = new Date()

  // Detect topic changes, sentiment, etc.
  conversations.set(msg.sender, conv)
})
```

### 18. Multi-Account Support
Handle multiple phone numbers:

```typescript
// If you have multiple Macs or devices
const accounts = [
  { phone: '+1111111111', sdk: new IMessageSDK() },
  { phone: '+2222222222', sdk: new IMessageSDK() }
]

// Monitor all accounts
for (const account of accounts) {
  await account.sdk.startWatching({
    onDirectMessage: async (msg) => {
      console.log(`[${account.phone}] New message:`, msg.text)
    }
  })
}
```

---

## 🚀 Your Ideas?

These are just starting points! The SDK is super flexible - build whatever you can imagine:

- Home automation triggers
- Personal assistant integrations
- Custom notification systems
- Message-based games
- And much more!

**Get creative and have fun!** 🎉
