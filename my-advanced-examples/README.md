# 🔥 Advanced iMessage Kit Examples

**Premium features - Requires Photon subscription**

These examples showcase the advanced capabilities only available with the paid Advanced iMessage Kit.

## 🚨 Setup Required

1. **Get Subscription**: Contact daniel@photon.codes
2. **Get Your Subdomain**: They'll give you `yourname.imsgd.photon.codes`
3. **Configure**: Edit `/Users/kylebartlett/Documents/imessage-kit/advanced-config.json`
4. **Test Connection**: Run `./1-test-connection.ts`

## 📋 Examples

### 1. Test Connection
**File:** `1-test-connection.ts`

Verify your Photon subscription and server connection.

```bash
npx tsx 1-test-connection.ts
```

Tests:
- Socket connection
- Server info
- Chat access
- Message statistics

---

### 2. Reactions (Tapbacks)
**File:** `2-send-with-reactions.ts`

Send messages and add/remove reactions.

```bash
CHAT="+1234567890" npx tsx 2-send-with-reactions.ts
```

Features:
- ❤️ Love
- 👍 Like
- 👎 Dislike
- 😂 Laugh
- ‼️ Emphasize
- ❓ Question

---

### 3. Edit & Unsend
**File:** `3-edit-unsend.ts`

Edit sent messages or unsend them completely.

```bash
CHAT="+1234567890" npx tsx 3-edit-unsend.ts
```

**Limits:**
- Edit: Within 15 minutes
- Unsend: Within 2 minutes
- Requires macOS Ventura+

---

### 4. Typing Indicators
**File:** `4-typing-indicators.ts`

Show "..." typing indicator before sending.

```bash
CHAT="+1234567890" npx tsx 4-typing-indicators.ts
```

Makes your bot feel human!

---

### 5. Message Effects
**File:** `5-message-effects.ts`

Send messages with visual effects.

```bash
CHAT="+1234567890" npx tsx 5-message-effects.ts
```

Effects:
- 🎉 Confetti
- 🎆 Fireworks
- ⚡ Lasers
- ⭐ Shooting Star
- 🎊 Celebration
- 🎈 Balloons
- 💕 Love Hearts

---

### 6. Real-Time Listener
**File:** `6-realtime-listener.ts`

WebSocket-based instant message updates (no polling!).

```bash
npx tsx 6-realtime-listener.ts
```

Features:
- Instant message delivery
- Typing events
- Read receipts
- Group events
- Auto-reactions

Press Ctrl+C to stop.

---

### 7. Advanced Bot
**File:** `7-advanced-bot.ts`

**THE BIG DOG** - Full-featured bot with everything.

```bash
npx tsx 7-advanced-bot.ts
```

**Features:**
- ✅ Typing indicators
- ✅ Smart reactions based on content
- ✅ Message effects
- ✅ Context-aware replies
- ✅ Edit demo
- ✅ Real-time WebSocket updates

**Example interaction:**
```
You: "Happy birthday!"
Bot: [typing...]
Bot: "Happy Birthday! 🎂🎉" [with balloon effect]

You: "I love this bot"
Bot: [typing...]
Bot: ❤️ [adds love reaction]
Bot: "Love you too! 💕" [with heart effect]

You: "Haha that's funny"
Bot: 😂 [adds laugh reaction only]
```

---

## 🆚 Basic vs Advanced

| Feature | Basic (Free) | Advanced (Paid) |
|---------|-------------|-----------------|
| Send messages | ✅ | ✅ |
| Receive messages | ✅ | ✅ |
| Read history | ✅ | ✅ |
| Message watching | ✅ (polling) | ✅ (WebSocket) |
| **Edit messages** | ❌ | ✅ |
| **Unsend messages** | ❌ | ✅ |
| **Reactions** | ❌ | ✅ |
| **Typing indicators** | ❌ | ✅ |
| **Message effects** | ❌ | ✅ |
| **Voice messages** | ❌ | ✅ |
| **Threaded replies** | ❌ | ✅ |
| **Create groups** | ❌ | ✅ |
| **Group management** | ❌ | ✅ |
| **FaceTime links** | ❌ | ✅ |
| **Find My integration** | ❌ | ✅ |
| **Scheduled messages** | ❌ | ✅ |
| **Real-time WebSocket** | ❌ | ✅ |
| **Read receipts** | ❌ | ✅ |

---

## 💡 Tips

### Chat GUIDs

For groups, get the chatId:
```typescript
const chats = await sdk.chats.getChats()
const groupChat = chats.find(c => c.isGroup && c.displayName === 'My Group')
console.log(groupChat.chatId) // Use this for sending
```

For DMs, use the format:
```
any;-;+1234567890
any;-;user@example.com
```

### Error Handling

Always wrap in try/catch:
```typescript
try {
  await sdk.messages.sendMessage({ ... })
} catch (error) {
  console.error('Failed:', error.message)
}
```

### Keep Connection Alive

```typescript
// For bots that run 24/7
process.on('SIGINT', async () => {
  await sdk.disconnect()
  process.exit(0)
})
```

---

## 🎯 Next Steps

1. **Test connection**: `./1-test-connection.ts`
2. **Try reactions**: `./2-send-with-reactions.ts`
3. **Run advanced bot**: `./7-advanced-bot.ts`
4. **Build your own**: Copy and customize!

---

## 🔗 Resources

- **Get Subscription**: daniel@photon.codes
- **Advanced Docs**: `/Users/kylebartlett/Documents/imessage-kit/advanced-imessage-kit/README.md`
- **Official Examples**: `/Users/kylebartlett/Documents/imessage-kit/advanced-imessage-kit/examples/`
- **Discord**: https://discord.gg/RSJUUHTV

---

## 🚀 THE BIG DOGS

These are the premium features that make Advanced worth it:

1. **Edit/Unsend** - Fix mistakes or remove messages
2. **Reactions** - Express yourself with tapbacks
3. **Typing Indicators** - Make bots feel human
4. **Message Effects** - Visual flair for special occasions
5. **Real-time WebSocket** - Instant updates, no polling lag
6. **Group Management** - Create and manage groups programmatically
7. **Scheduled Messages** - Set it and forget it

**Ready to unleash the big dogs?** 🐕🔥
