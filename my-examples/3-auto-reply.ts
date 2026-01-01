#!/usr/bin/env npx tsx
/**
 * Auto-reply bot - responds to incoming messages automatically
 * Press Ctrl+C to stop
 *
 * Usage: npx tsx 3-auto-reply.ts
 */

import { IMessageSDK } from '../imessage-kit/dist/index.js'

async function main() {
  console.log('🤖 Starting Auto-Reply Bot\n')
  console.log('📝 Bot will respond to messages containing keywords')
  console.log('   Press Ctrl+C to stop\n')

  const sdk = new IMessageSDK({
    debug: false,
    watcher: {
      pollInterval: 2000,           // Check every 2 seconds
      excludeOwnMessages: true,     // Don't respond to yourself
      unreadOnly: false             // Respond to all new messages
    }
  })

  // Track processed messages to avoid duplicates
  const processedMessages = new Set<string>()

  await sdk.startWatching({
    onDirectMessage: async (message) => {
      // Skip if already processed
      if (processedMessages.has(message.id)) return
      processedMessages.add(message.id)

      const text = message.text?.toLowerCase() || ''
      const sender = message.sender

      console.log(`\n📨 New message from ${sender}`)
      console.log(`   Message: "${message.text}"`)

      // Auto-reply based on keywords
      let reply: string | null = null

      if (text.includes('hello') || text.includes('hi')) {
        reply = 'Hey there! How can I help you today?'
      } else if (text.includes('how are you')) {
        reply = 'I\'m doing great, thanks for asking! How about you?'
      } else if (text.includes('help')) {
        reply = 'I\'m an auto-reply bot! Try saying "hello" or asking "how are you"'
      } else if (text.includes('thanks') || text.includes('thank')) {
        reply = 'You\'re welcome! 😊'
      } else {
        // Default reply for unrecognized messages
        reply = 'Thanks for your message! I received it.'
      }

      if (reply) {
        console.log(`   🤖 Replying: "${reply}"`)

        try {
          await sdk.send(sender, reply)
          console.log('   ✅ Reply sent!')
        } catch (error) {
          console.error('   ❌ Failed to send reply:', error.message)
        }
      }

      // Clean up old processed messages (keep last 100)
      if (processedMessages.size > 100) {
        const toDelete = Array.from(processedMessages).slice(0, 50)
        toDelete.forEach(id => processedMessages.delete(id))
      }
    },

    onError: (error) => {
      console.error('\n❌ Watcher error:', error.message)
    }
  })

  console.log('✅ Auto-reply bot is running!')
  console.log('   Waiting for messages...\n')

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Stopping auto-reply bot...')
    sdk.stopWatching()
    await sdk.close()
    console.log('✅ Bot stopped successfully')
    process.exit(0)
  })
}

main()
