# ⚡ Quick Start Guide

**Get up and running in 60 seconds!**

## 🎯 Test Your Setup (30 seconds)

```bash
cd /Users/kylebartlett/Documents/imessage-kit/my-examples
npx tsx 1-test-basic.ts
```

Expected output:
```
✅ All tests passed! Basic iMessage Kit is working correctly.
```

---

## 🚀 Send Your First Message (30 seconds)

Edit the phone number in `2-send-simple.ts`:

```typescript
const phoneNumber = '+YOUR_PHONE_NUMBER'
```

Then run:
```bash
npx tsx 2-send-simple.ts
```

---

## 🤖 Start an Auto-Reply Bot (10 seconds)

```bash
npx tsx 3-auto-reply.ts
```

Now text yourself from another phone and watch it reply!

Press `Ctrl+C` to stop.

---

## 📊 See Your Texting Stats

```bash
npx tsx 7-fun-stats.ts
```

Shows:
- Top 10 people you text
- Who texts more in each conversation
- Fun facts about your messaging habits

---

## 📚 All Examples

Located in: `/Users/kylebartlett/Documents/imessage-kit/my-examples/`

| Script | What it does |
|--------|-------------|
| `1-test-basic.ts` | Test your setup |
| `2-send-simple.ts` | Send a message |
| `3-auto-reply.ts` | Auto-reply bot |
| `4-read-unread.ts` | Show all unread messages |
| `5-list-all-chats.ts` | List all your chats |
| `6-search-messages.ts` | Search message history |
| `7-fun-stats.ts` | Messaging statistics |
| `8-batch-send.ts` | Send to multiple people |
| `9-download-images.ts` | Download images from chat |

---

## 💡 Pro Tips

### Make Scripts Executable
```bash
cd /Users/kylebartlett/Documents/imessage-kit/my-examples
chmod +x *.ts
./1-test-basic.ts  # Now runs directly!
```

### Use Environment Variables
```bash
PHONE="+1234567890" npx tsx 2-send-simple.ts
SEARCH="lunch" npx tsx 6-search-messages.ts
```

### Auto-Reply Customization
Edit `3-auto-reply.ts` and add your own keywords:

```typescript
if (text.includes('your-keyword')) {
  reply = 'Your custom response!'
}
```

---

## 🎨 Build Your Own

Use these examples as templates! Copy and modify:

```bash
cp 3-auto-reply.ts my-custom-bot.ts
# Edit my-custom-bot.ts
npx tsx my-custom-bot.ts
```

---

## 🆘 Issues?

Check the full setup guide:
```
/Users/kylebartlett/Documents/imessage-kit/SETUP_GUIDE.md
```

Or README in examples:
```
/Users/kylebartlett/Documents/imessage-kit/my-examples/README.md
```

---

## 🎯 Next Steps

1. ✅ Test your setup → `npx tsx 1-test-basic.ts`
2. 🤖 Try the auto-reply bot → `npx tsx 3-auto-reply.ts`
3. 📊 Check your stats → `npx tsx 7-fun-stats.ts`
4. 🛠️ Build something cool!

**Have fun!** 🎉
