# My iMessage Kit Examples

Quick-start examples for Basic iMessage Kit. All scripts are ready to run!

## 📋 Prerequisites

1. **Full Disk Access** granted to your Terminal/IDE
2. **Node.js 18+** installed
3. **tsx** for running TypeScript (installed automatically when you run scripts)

## 🚀 Quick Start

All scripts can be run directly with:
```bash
npx tsx <script-name>.ts
```

No build step needed!

---

## 📝 Examples

### 1. Test Basic Setup
**File:** `1-test-basic.ts`

Tests your Basic iMessage Kit installation by:
- Reading recent messages
- Listing chats
- Checking unread messages
- Verifying database access

```bash
npx tsx 1-test-basic.ts
```

**Expected output:**
```
🧪 Testing Basic iMessage Kit

📥 Test 1: Reading last 5 messages...
   ✅ Found 127 total messages
   Latest: "Hey, how are you?..." from +1234567890

💬 Test 2: Listing chats...
   ✅ Found 15 chats

✉️  Test 3: Checking unread messages...
   ✅ 3 unread messages from 2 people

🗄️  Test 4: Database connection...
   ✅ Database accessible

✅ All tests passed!
```

---

### 2. Send Simple Message
**File:** `2-send-simple.ts`

Send a text message to a phone number.

```bash
# Set phone number via environment variable
PHONE="+1234567890" npx tsx 2-send-simple.ts

# Or edit the phoneNumber variable in the script
```

**Customize:**
- Uncomment image sending section to send photos
- Uncomment file sending section to send documents

---

### 3. Auto-Reply Bot
**File:** `3-auto-reply.ts`

Automatically replies to incoming messages based on keywords.

```bash
npx tsx 3-auto-reply.ts
```

**Features:**
- Responds to "hello", "hi", "help", "thanks", etc.
- Avoids duplicate responses
- Runs continuously (Ctrl+C to stop)
- Excludes your own messages

**Example conversation:**
```
Them: "Hello!"
Bot:  "Hey there! How can I help you today?"

Them: "How are you?"
Bot:  "I'm doing great, thanks for asking! How about you?"
```

---

### 4. Read Unread Messages
**File:** `4-read-unread.ts`

Displays all unread messages grouped by sender.

```bash
npx tsx 4-read-unread.ts
```

**Output example:**
```
📊 Summary: 5 unread messages from 3 people

👤 +1234567890 (2 messages)
   1. [11/21/2025, 2:30 PM]
      Hey, are you free for lunch?

   2. [11/21/2025, 2:45 PM]
      Let me know!

👤 john@example.com (3 messages)
   ...
```

**Optional:** Uncomment the auto-reply section to send acknowledgments.

---

### 5. List All Chats
**File:** `5-list-all-chats.ts`

Shows all your chats (groups and DMs) with details.

```bash
npx tsx 5-list-all-chats.ts
```

**Shows:**
- Group chats with names and chat IDs
- Direct messages
- Last message timestamps
- Unread counts

**Use case:** Get chat IDs for sending to groups.

---

### 6. Search Messages
**File:** `6-search-messages.ts`

Search through your message history by keyword.

```bash
# Search for "meeting"
SEARCH="meeting" npx tsx 6-search-messages.ts

# Search for "lunch"
SEARCH="lunch" npx tsx 6-search-messages.ts
```

**Features:**
- Full-text search
- Shows sender and timestamp
- Breakdown by sender
- Supports up to 50 results

---

## 💡 Tips

### Running Scripts
```bash
# From my-examples directory
cd /Users/kylebartlett/Documents/imessage-kit/my-examples
npx tsx 1-test-basic.ts

# From anywhere
npx tsx /Users/kylebartlett/Documents/imessage-kit/my-examples/1-test-basic.ts
```

### Environment Variables
Many scripts support environment variables for quick configuration:

```bash
PHONE="+1234567890" npx tsx 2-send-simple.ts
SEARCH="keyword" npx tsx 6-search-messages.ts
```

### Making Scripts Executable
```bash
chmod +x *.ts
./1-test-basic.ts  # Now runs directly
```

### Customizing Examples
All scripts are well-commented. Edit them to:
- Change phone numbers
- Modify auto-reply responses
- Adjust search limits
- Add your own logic

---

## 🔧 Troubleshooting

### "Permission denied"
- Grant Full Disk Access to Terminal/IDE
- Restart Terminal/IDE after granting

### "Module not found"
```bash
# Make sure you're in the right directory
cd /Users/kylebartlett/Documents/imessage-kit/my-examples

# Or use full paths in imports
```

### "tsx not found"
tsx will be auto-installed when you run `npx tsx`. If issues persist:
```bash
npm install -g tsx
```

---

## 🤖 AI-Powered Bots (NEW!)

### 10. Claude Bot
**File:** `10-claude-bot.ts`

AI-powered auto-reply using Claude (Anthropic). Casual, friendly, and funny responses for friends & family.

```bash
npx tsx 10-claude-bot.ts
```

**Features:**
- 20 message conversation memory per chat
- Casual, friendly personality
- Responds to all DMs
- Group chats: responds when mentioned ("Bart") or to questions

---

### 11. Gemini Bot (Backup)
**File:** `11-gemini-bot.ts`

Same features as Claude bot but using Google's Gemini AI.

```bash
npx tsx 11-gemini-bot.ts
```

---

### 12. AI Bot with Fallback (RECOMMENDED)
**File:** `12-ai-bot-with-fallback.ts`

The main bot! Uses Claude as primary AI, automatically falls back to Gemini if Claude fails.

```bash
npx tsx 12-ai-bot-with-fallback.ts
```

**Features:**
- Primary: Claude (Sonnet)
- Backup: Gemini (Flash) - kicks in if Claude has issues
- 20 message memory per chat
- Session stats on exit
- Casual, friendly, funny personality

**Output example:**
```
🤖 AI-Powered iMessage Bot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 Primary: Claude (Sonnet)
🔄 Backup:  Gemini (Flash)
💬 Memory:  20 messages per chat
📝 Style:   Casual, friendly, funny
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Bot is running! Waiting for messages...

📨 From +1234567890:
   "Hey what are you up to?"
   🧠 Thinking...
   🤖 [Claude] "Not much, just chillin! What's good with you? 😄"
   ✅ Sent!
```

---

### AI Bot Configuration

API keys are stored in `.env` file (already configured):

```env
# Primary AI
ANTHROPIC_API_KEY=sk-ant-...

# Backup AI  
GEMINI_API_KEY=AIza...

# Settings
CONVERSATION_MEMORY=20
```

**Group Chat Behavior:**
- Only responds when "Bart" or "@bart" is mentioned
- Responds to questions (messages ending with ?)
- Keeps responses short and punchy in groups

---

## 📚 Next Steps

1. **Start with Test**: Run `1-test-basic.ts` to verify everything works
2. **Try Auto-Reply**: Experience real-time message handling
3. **Run AI Bot**: `npx tsx 12-ai-bot-with-fallback.ts` for smart AI responses
4. **Customize**: Edit scripts for your specific needs
5. **Build Your App**: Use these as templates for your own projects

---

## 🔗 Related Files

- **Main Setup Guide**: `/Users/kylebartlett/Documents/imessage-kit/SETUP_GUIDE.md`
- **Basic Version Docs**: `/Users/kylebartlett/Documents/imessage-kit/imessage-kit/README.md`
- **Official Examples**: `/Users/kylebartlett/Documents/imessage-kit/imessage-kit/examples/`
