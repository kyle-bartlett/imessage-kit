# iMessage Kit Setup & Usage Guide

## 📦 What You Have Installed

### Location: `/Users/kylebartlett/Documents/imessage-kit/`

```
imessage-kit/
├── imessage-kit/              # Basic Version (FREE - Standalone)
├── advanced-imessage-kit/     # Advanced Version (PAID - Hosted Service)
└── my-examples/               # Your custom examples
```

---

## 🚀 Quick Start: Basic Version (Start Here!)

### Prerequisites
1. **Full Disk Access** already granted to your IDE/Terminal
2. Node.js 18+ installed ✅

### Test Your Setup

```bash
cd /Users/kylebartlett/Documents/imessage-kit/imessage-kit
npm test
```

### Your First Message (5 seconds)

```typescript
import { IMessageSDK } from '@photon-ai/imessage-kit'

const sdk = new IMessageSDK()
await sdk.send('+1234567890', 'Hello from iMessage Kit!')
await sdk.close()
```

---

## 📱 Basic Version - Complete Setup

### 1. Quick Test Script

Create: `/Users/kylebartlett/Documents/imessage-kit/my-examples/test-basic.ts`

```typescript
import { IMessageSDK } from '@photon-ai/imessage-kit'

async function main() {
  const sdk = new IMessageSDK({ debug: true })

  // Test 1: Read recent messages
  console.log('📥 Reading recent messages...')
  const messages = await sdk.getMessages({ limit: 5 })
  console.log(`Found ${messages.total} messages`)

  // Test 2: List chats
  console.log('\n💬 Listing recent chats...')
  const chats = await sdk.listChats({ limit: 10 })
  console.log(`Found ${chats.length} chats`)

  // Test 3: Get unread count
  const unread = await sdk.getUnreadMessages()
  console.log(`\n✉️ Unread: ${unread.total} messages from ${unread.senderCount} people`)

  await sdk.close()
}

main()
```

Run with: `npx tsx /Users/kylebartlett/Documents/imessage-kit/my-examples/test-basic.ts`

### 2. Common Patterns

#### Auto-Reply Bot
```typescript
import { IMessageSDK } from '@photon-ai/imessage-kit'

const sdk = new IMessageSDK({
  watcher: {
    pollInterval: 2000,
    excludeOwnMessages: true
  }
})

await sdk.startWatching({
  onDirectMessage: async (msg) => {
    console.log(`📨 From ${msg.sender}: ${msg.text}`)

    // Smart replies
    if (msg.text?.toLowerCase().includes('hello')) {
      await sdk.send(msg.sender, 'Hey! How can I help you?')
    }
  },
  onError: (err) => console.error('Error:', err)
})

// Keep running
process.on('SIGINT', async () => {
  sdk.stopWatching()
  await sdk.close()
  process.exit(0)
})
```

#### Read & Respond to Unread
```typescript
const sdk = new IMessageSDK()

// Get all unread messages
const unread = await sdk.getUnreadMessages()

for (const { sender, messages } of unread.groups) {
  console.log(`\n${sender} sent ${messages.length} messages:`)

  for (const msg of messages) {
    console.log(`  - ${msg.text}`)
  }

  // Reply to each sender
  await sdk.send(sender, 'Thanks for your message! I\'ll get back to you soon.')
}

await sdk.close()
```

---

## 🎯 Advanced Version - Complete Setup

### Prerequisites
1. **Photon subscription** required
2. Get your subdomain from: daniel@photon.codes
3. Server URL format: `{your-name}.imsgd.photon.codes`

### 1. Configuration File

Create: `/Users/kylebartlett/Documents/imessage-kit/advanced-config.json`

```json
{
  "serverUrl": "YOUR_SUBDOMAIN.imsgd.photon.codes",
  "logLevel": "info"
}
```

### 2. Test Connection Script

Create: `/Users/kylebartlett/Documents/imessage-kit/my-examples/test-advanced.ts`

```typescript
import { SDK } from '@photon-ai/advanced-imessage-kit'
import config from '../advanced-config.json'

async function main() {
  const sdk = SDK({
    serverUrl: config.serverUrl,
    logLevel: 'debug'
  })

  // Connect
  console.log('🔌 Connecting to Photon servers...')
  await sdk.connect()

  // Wait for ready
  sdk.on('ready', async () => {
    console.log('✅ Connected and ready!')

    // Get server info
    const info = await sdk.server.getServerInfo()
    console.log('Server info:', info)

    // Get chats
    const chats = await sdk.chats.getChats()
    console.log(`Found ${chats.length} chats`)
  })

  sdk.on('error', (err) => {
    console.error('❌ Error:', err)
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await sdk.disconnect()
    process.exit(0)
  })
}

main()
```

### 3. Advanced Features Examples

#### Real-Time Message Listener with Reactions
```typescript
import { SDK } from '@photon-ai/advanced-imessage-kit'

const sdk = SDK({ serverUrl: 'YOUR_SUBDOMAIN.imsgd.photon.codes' })
await sdk.connect()

// Listen for new messages
sdk.on('new-message', async (message) => {
  console.log(`📨 ${message.handle?.address}: ${message.text}`)

  // Auto-react with ❤️ to messages containing "love"
  if (message.text?.toLowerCase().includes('love')) {
    await sdk.messages.sendReaction({
      chatGuid: message.chatGuid,
      messageGuid: message.guid,
      reaction: 'love'
    })
    console.log('❤️ Reacted with love!')
  }
})

// Listen for typing indicators
sdk.on('typing-indicator', (data) => {
  if (data.display) {
    console.log('💬 Someone is typing...')
  }
})
```

#### Edit & Unsend Messages
```typescript
const sdk = SDK({ serverUrl: 'YOUR_SUBDOMAIN.imsgd.photon.codes' })
await sdk.connect()

// Send a message
const msg = await sdk.messages.sendMessage({
  chatGuid: 'any;-;+1234567890',
  message: 'Original message'
})

console.log('Sent:', msg.text)

// Wait 5 seconds
await new Promise(r => setTimeout(r, 5000))

// Edit it (within 15 min)
await sdk.messages.editMessage({
  messageGuid: msg.guid,
  editedMessage: 'Edited message!',
  backwardsCompatibilityMessage: 'Edited message!'
})
console.log('✏️ Message edited!')

// Or unsend it (within 2 min)
// await sdk.messages.unsendMessage({ messageGuid: msg.guid })
```

---

## 💡 Practical Tips & Best Practices

### File Paths
Always use absolute paths when sending files:

```typescript
// ✅ Good
await sdk.send('+1234567890', {
  images: ['/Users/kylebartlett/Pictures/photo.jpg']
})

// ❌ Bad
await sdk.send('+1234567890', {
  images: ['~/Pictures/photo.jpg']  // Won't work
})
```

### Chat IDs vs Phone Numbers

```typescript
// For DMs, you can use:
await sdk.send('+1234567890', 'Hello')        // Phone number
await sdk.send('user@example.com', 'Hello')   // Email

// For groups, you MUST use chatId:
const chats = await sdk.listChats({ type: 'group' })
const groupChatId = chats[0].chatId
await sdk.send(groupChatId, 'Hello group!')
```

### Error Handling

```typescript
try {
  await sdk.send('+1234567890', 'Hello')
} catch (error) {
  if (error instanceof SendError) {
    console.error('Send failed:', error.message)
  } else {
    console.error('Unknown error:', error)
  }
}
```

### Always Close Connections

```typescript
// Basic version
const sdk = new IMessageSDK()
// ... do stuff ...
await sdk.close()  // Important!

// Advanced version
const sdk = SDK({ serverUrl: '...' })
await sdk.connect()
// ... do stuff ...
await sdk.disconnect()  // Important!
```

### Watching Messages Efficiently

```typescript
// Don't poll too frequently (basic version)
const sdk = new IMessageSDK({
  watcher: {
    pollInterval: 3000  // 3 seconds is good balance
  }
})

// Advanced version uses WebSockets (no polling needed!)
```

---

## 🎨 Common Use Cases

### 1. Broadcast Messages to Multiple People

```typescript
const sdk = new IMessageSDK()

const recipients = ['+1111111111', '+2222222222', '+3333333333']

await sdk.sendBatch(
  recipients.map(phone => ({
    to: phone,
    content: 'Hello everyone! This is a broadcast message.'
  }))
)

await sdk.close()
```

### 2. Download All Images from a Chat

```typescript
import { downloadAttachment, isImageAttachment } from '@photon-ai/imessage-kit'

const sdk = new IMessageSDK()

const messages = await sdk.getMessages({
  sender: '+1234567890',
  hasAttachments: true,
  limit: 100
})

let count = 0
for (const msg of messages.messages) {
  for (const att of msg.attachments) {
    if (isImageAttachment(att)) {
      await downloadAttachment(
        att,
        `/Users/kylebartlett/Downloads/image_${count++}.jpg`
      )
    }
  }
}

console.log(`Downloaded ${count} images`)
await sdk.close()
```

### 3. Get Today's Message Count

```typescript
const sdk = new IMessageSDK()

const today = new Date()
today.setHours(0, 0, 0, 0)

const messages = await sdk.getMessages({
  since: today,
  excludeOwnMessages: false
})

console.log(`You've sent/received ${messages.total} messages today`)
await sdk.close()
```

---

## 🔧 Troubleshooting

### "Permission denied" when reading messages
- Grant Full Disk Access to your IDE/Terminal
- Restart your IDE after granting access

### "Database is locked"
- Messages app is using the database
- Try closing Messages app or use a read-only copy

### Basic version: Messages not detected immediately
- Basic version polls every 2-3 seconds
- Increase `pollInterval` if needed
- Consider Advanced version for real-time WebSockets

### Advanced version: Connection failed
- Check your server URL is correct
- Verify your subscription is active
- Check internet connection

---

## 📚 Next Steps

1. **Test Basic Version**: Run the test script to verify everything works
2. **Explore Examples**: Check out the examples in both repos
3. **Build Your Bot**: Start with auto-replies and expand from there
4. **Subscribe to Advanced** (if needed): Contact daniel@photon.codes

---

## 🆘 Getting Help

- **Basic Version Issues**: https://github.com/photon-hq/imessage-kit/issues
- **Advanced Version Issues**: https://github.com/photon-hq/advanced-imessage-kit/issues
- **Discord**: https://discord.gg/bZd4CMd2H5
- **Email**: daniel@photon.codes
