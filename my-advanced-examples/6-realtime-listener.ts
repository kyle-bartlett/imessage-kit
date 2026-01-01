#!/usr/bin/env npx tsx
/**
 * Real-time message listener with WebSockets
 * ADVANCED FEATURE - Instant updates, no polling
 *
 * Usage: npx tsx 6-realtime-listener.ts
 */

import { SDK } from '../../advanced-imessage-kit/dist/index.js'
import config from '../../advanced-config.json'

async function main() {
  console.log('🔴 Advanced: Real-Time Message Listener\n')
  console.log('💡 Using WebSockets for instant updates (no polling!)\n')
  console.log('Press Ctrl+C to stop\n')

  const sdk = SDK({ serverUrl: config.serverUrl, logLevel: 'info' })

  try {
    await sdk.connect()
    console.log('✅ Connected to Photon servers\n')

    // Track message counts
    let messageCount = 0
    let typingEvents = 0
    let reactionCount = 0

    sdk.on('ready', () => {
      console.log('🎉 Real-time listener is active!')
      console.log('━'.repeat(70))
      console.log('Waiting for messages...\n')
    })

    // Listen for new messages
    sdk.on('new-message', async (message) => {
      messageCount++
      const from = message.handle?.address || 'Unknown'
      const text = message.text || '[No text]'
      const time = new Date().toLocaleTimeString()

      console.log(`\n📨 [${time}] Message #${messageCount}`)
      console.log(`   From: ${from}`)
      console.log(`   Text: ${text}`)

      if (message.attachments && message.attachments.length > 0) {
        console.log(`   📎 ${message.attachments.length} attachment(s)`)
      }

      if (message.isAudioMessage) {
        console.log('   🎤 Voice message!')
      }

      // Auto-react with ❤️ to messages containing "love"
      if (text.toLowerCase().includes('love')) {
        console.log('   ❤️  Auto-reacting with love...')
        try {
          await sdk.messages.sendReaction({
            chatGuid: message.chatGuid,
            messageGuid: message.guid,
            reaction: 'love'
          })
          console.log('   ✅ Reaction sent!')
          reactionCount++
        } catch (err) {
          console.log('   ⚠️  Could not send reaction')
        }
      }
    })

    // Listen for typing indicators
    sdk.on('typing-indicator', (data) => {
      typingEvents++
      if (data.display) {
        console.log('\n💬 Someone is typing...')
      }
    })

    // Listen for message updates (read receipts, delivery status)
    sdk.on('updated-message', (message) => {
      const status = message.dateRead
        ? '✅ Read'
        : message.dateDelivered
        ? '📬 Delivered'
        : '📤 Sent'

      console.log(`\n📊 Message status update: ${status}`)
    })

    // Listen for group events
    sdk.on('participant-added', (data) => {
      console.log(`\n👥 Someone joined: ${data.chat.displayName}`)
    })

    sdk.on('participant-removed', (data) => {
      console.log(`\n👋 Someone left: ${data.chat.displayName}`)
    })

    sdk.on('group-name-change', (data) => {
      console.log(`\n✏️  Group renamed: ${data.message.groupTitle}`)
    })

    // Error handling
    sdk.on('error', (error) => {
      console.error('\n❌ Error:', error.message)
    })

    sdk.on('disconnect', () => {
      console.log('\n⚠️  Disconnected from server')
    })

    // Show stats every 30 seconds
    setInterval(() => {
      console.log('\n' + '━'.repeat(70))
      console.log('📊 Session Stats:')
      console.log(`   📨 Messages received: ${messageCount}`)
      console.log(`   ❤️  Reactions sent: ${reactionCount}`)
      console.log(`   💬 Typing events: ${typingEvents}`)
      console.log('━'.repeat(70) + '\n')
    }, 30000)

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down...')
      console.log('\n📊 Final Stats:')
      console.log(`   📨 Messages received: ${messageCount}`)
      console.log(`   ❤️  Reactions sent: ${reactionCount}`)
      console.log(`   💬 Typing events: ${typingEvents}`)
      await sdk.disconnect()
      console.log('\n✅ Disconnected cleanly')
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ Failed:', error.message)
    process.exit(1)
  }
}

main()
