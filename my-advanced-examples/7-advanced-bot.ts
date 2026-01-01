#!/usr/bin/env npx tsx
/**
 * Advanced auto-reply bot with ALL features
 * - Typing indicators
 * - Reactions
 * - Message effects
 * - Edit capabilities
 * - Real-time WebSocket updates
 *
 * Usage: npx tsx 7-advanced-bot.ts
 */

import { SDK } from '../../advanced-imessage-kit/dist/index.js'
import config from '../../advanced-config.json'

async function main() {
  console.log('🤖 ADVANCED Auto-Reply Bot\n')
  console.log('🔥 Features: Typing indicators, reactions, effects, edits\n')
  console.log('Press Ctrl+C to stop\n')

  const sdk = SDK({ serverUrl: config.serverUrl, logLevel: 'info' })

  // Track processed messages
  const processedMessages = new Set<string>()

  try {
    await sdk.connect()
    console.log('✅ Connected\n')

    sdk.on('ready', () => {
      console.log('🎉 Advanced bot is active!')
      console.log('━'.repeat(70))
      console.log('Waiting for messages...\n')
    })

    sdk.on('new-message', async (message) => {
      // Skip if already processed or from yourself
      if (processedMessages.has(message.guid) || message.isFromMe) return
      processedMessages.add(message.guid)

      const text = message.text?.toLowerCase() || ''
      const from = message.handle?.address || 'Unknown'
      const chatGuid = message.chatGuid

      console.log(`\n📨 New message from ${from}: "${message.text}"`)

      try {
        // Show typing indicator
        console.log('   💬 Showing typing indicator...')
        await sdk.chats.startTyping(chatGuid)

        // Wait 2 seconds (realistic typing)
        await new Promise(r => setTimeout(r, 2000))

        let reply: string | null = null
        let effect: string | undefined = undefined

        // Smart responses with effects
        if (text.includes('hello') || text.includes('hi')) {
          reply = 'Hey there! How can I help you? 👋'
        } else if (text.includes('birthday') || text.includes('congrats')) {
          reply = 'Happy Birthday! 🎂🎉'
          effect = 'com.apple.messages.effect.CKHappyBirthdayEffect'
        } else if (text.includes('love')) {
          reply = 'Love you too! 💕'
          effect = 'com.apple.messages.effect.CKHeartEffect'

          // Also add a love reaction
          await sdk.messages.sendReaction({
            chatGuid: chatGuid,
            messageGuid: message.guid,
            reaction: 'love'
          })
          console.log('   ❤️  Added love reaction')
        } else if (text.includes('awesome') || text.includes('great')) {
          reply = 'Thanks! You\'re awesome too! ✨'
          effect = 'com.apple.messages.effect.CKSparklesEffect'

          // Thumbs up reaction
          await sdk.messages.sendReaction({
            chatGuid: chatGuid,
            messageGuid: message.guid,
            reaction: 'like'
          })
          console.log('   👍 Added like reaction')
        } else if (text.includes('funny') || text.includes('lol') || text.includes('haha')) {
          // Just add laugh reaction, no reply
          await sdk.messages.sendReaction({
            chatGuid: chatGuid,
            messageGuid: message.guid,
            reaction: 'laugh'
          })
          console.log('   😂 Added laugh reaction')
        } else if (text.includes('thanks') || text.includes('thank you')) {
          reply = 'You\'re very welcome! 😊'
        } else {
          reply = 'Thanks for your message! I received it. 👍'
        }

        // Stop typing indicator
        await sdk.chats.stopTyping(chatGuid)

        // Send reply if we have one
        if (reply) {
          console.log(`   📤 Replying: "${reply}"`)

          const sentMessage = await sdk.messages.sendMessage({
            chatGuid: chatGuid,
            message: reply,
            effectId: effect
          })

          console.log('   ✅ Reply sent!')

          if (effect) {
            console.log(`   ✨ With effect: ${effect.split('.').pop()}`)
          }

          // Example: Edit message after 3 seconds (demo)
          if (text.includes('edit demo')) {
            await new Promise(r => setTimeout(r, 3000))
            await sdk.messages.editMessage({
              messageGuid: sentMessage.guid,
              editedMessage: reply + ' [Edited to show edit feature!]',
              backwardsCompatibilityMessage: reply + ' [Edited!]'
            })
            console.log('   ✏️  Edited the reply (demo)')
          }
        }

      } catch (error) {
        console.error('   ❌ Error processing message:', error.message)
      }

      // Clean up old processed messages (keep last 1000)
      if (processedMessages.size > 1000) {
        const toDelete = Array.from(processedMessages).slice(0, 500)
        toDelete.forEach(id => processedMessages.delete(id))
      }
    })

    // Handle errors
    sdk.on('error', (error) => {
      console.error('\n❌ Error:', error.message)
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Stopping bot...')
      await sdk.disconnect()
      console.log('✅ Bot stopped cleanly')
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ Failed:', error.message)
    process.exit(1)
  }
}

main()
