#!/usr/bin/env npx tsx
/**
 * Typing indicators - show you're typing
 * ADVANCED FEATURE - Requires Private API and Photon subscription
 *
 * Usage:
 *   CHAT="+1234567890" npx tsx 4-typing-indicators.ts
 */

import { SDK } from '../../advanced-imessage-kit/dist/index.js'
import config from '../../advanced-config.json'

async function main() {
  const chatGuid = process.env.CHAT || 'any;-;+1234567890'

  console.log('💬 Advanced: Typing Indicators\n')
  console.log(`📱 Chat: ${chatGuid}\n`)

  const sdk = SDK({ serverUrl: config.serverUrl, logLevel: 'info' })

  try {
    await sdk.connect()
    console.log('✅ Connected\n')

    await new Promise<void>((resolve) => {
      sdk.on('ready', async () => {
        try {
          console.log('💬 Starting typing indicator...')
          await sdk.chats.startTyping(chatGuid)
          console.log('✅ Other person sees "..." (you are typing)\n')

          // Type for 5 seconds
          for (let i = 5; i > 0; i--) {
            console.log(`   Still typing... (${i}s remaining)`)
            await new Promise(r => setTimeout(r, 1000))
          }

          console.log('\n⏹️  Stopping typing indicator...')
          await sdk.chats.stopTyping(chatGuid)
          console.log('✅ Typing indicator stopped\n')

          // Now send the actual message
          console.log('📤 Sending message...')
          await sdk.messages.sendMessage({
            chatGuid: chatGuid,
            message: 'I was just showing off the typing indicator! 😎'
          })
          console.log('✅ Message sent!\n')

          console.log('🎉 Demo complete!')
          console.log('\n💡 Use case: Make your bot feel more human')
          console.log('   Show typing before sending replies\n')

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
