#!/usr/bin/env npx tsx
/**
 * Send message and add reactions (tapbacks)
 * ADVANCED FEATURE - Requires Photon subscription
 *
 * Usage:
 *   CHAT="+1234567890" npx tsx 2-send-with-reactions.ts
 */

import { SDK } from '../../advanced-imessage-kit/dist/index.js'
import config from '../../advanced-config.json'

async function main() {
  const chatGuid = process.env.CHAT || 'any;-;+1234567890'

  console.log('❤️  Advanced: Send Message + Reactions\n')
  console.log(`📱 Chat: ${chatGuid}\n`)

  const sdk = SDK({ serverUrl: config.serverUrl, logLevel: 'info' })

  try {
    await sdk.connect()
    console.log('✅ Connected\n')

    await new Promise<void>((resolve) => {
      sdk.on('ready', async () => {
        try {
          // Send a message
          console.log('📤 Sending message...')
          const message = await sdk.messages.sendMessage({
            chatGuid: chatGuid,
            message: 'This is an advanced test message! 🚀'
          })

          console.log(`✅ Message sent! GUID: ${message.guid}\n`)

          // Wait a moment
          await new Promise(r => setTimeout(r, 2000))

          // Add a love reaction (❤️)
          console.log('❤️  Adding love reaction...')
          await sdk.messages.sendReaction({
            chatGuid: chatGuid,
            messageGuid: message.guid,
            reaction: 'love',
            partIndex: 0
          })
          console.log('✅ Love reaction added!\n')

          // Wait a moment
          await new Promise(r => setTimeout(r, 2000))

          // Remove the reaction
          console.log('🔄 Removing reaction...')
          await sdk.messages.sendReaction({
            chatGuid: chatGuid,
            messageGuid: message.guid,
            reaction: '-love', // Prefix with - to remove
            partIndex: 0
          })
          console.log('✅ Reaction removed!\n')

          // Try different reactions
          console.log('👍 Adding thumbs up...')
          await sdk.messages.sendReaction({
            chatGuid: chatGuid,
            messageGuid: message.guid,
            reaction: 'like'
          })
          console.log('✅ Thumbs up added!\n')

          console.log('🎉 All reactions sent successfully!')
          console.log('\n💡 Available reactions:')
          console.log('   love ❤️, like 👍, dislike 👎, laugh 😂')
          console.log('   emphasize ‼️, question ❓')
          console.log('   Prefix with - to remove (e.g., -love)\n')

          await sdk.disconnect()
          resolve()

        } catch (error) {
          console.error('❌ Error:', error.message)
          await sdk.disconnect()
          process.exit(1)
        }
      })
    })

  } catch (error) {
    console.error('❌ Failed:', error.message)
    process.exit(1)
  }

  process.exit(0)
}

main()
