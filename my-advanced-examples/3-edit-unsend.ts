#!/usr/bin/env npx tsx
/**
 * Edit and unsend messages
 * ADVANCED FEATURE - Requires macOS Ventura+ and Photon subscription
 *
 * Usage:
 *   CHAT="+1234567890" npx tsx 3-edit-unsend.ts
 */

import { SDK } from '../../advanced-imessage-kit/dist/index.js'
import config from '../../advanced-config.json'

async function main() {
  const chatGuid = process.env.CHAT || 'any;-;+1234567890'

  console.log('✏️  Advanced: Edit & Unsend Messages\n')
  console.log(`📱 Chat: ${chatGuid}\n`)

  const sdk = SDK({ serverUrl: config.serverUrl, logLevel: 'info' })

  try {
    await sdk.connect()
    console.log('✅ Connected\n')

    await new Promise<void>((resolve) => {
      sdk.on('ready', async () => {
        try {
          // Demo 1: Edit a message
          console.log('📤 Sending original message...')
          const msg1 = await sdk.messages.sendMessage({
            chatGuid: chatGuid,
            message: 'This mesage has a typo'
          })
          console.log(`✅ Sent: "${msg1.text}"\n`)

          await new Promise(r => setTimeout(r, 3000))

          console.log('✏️  Editing message to fix typo...')
          await sdk.messages.editMessage({
            messageGuid: msg1.guid,
            editedMessage: 'This message has been corrected ✓',
            backwardsCompatibilityMessage: 'This message has been corrected ✓'
          })
          console.log('✅ Message edited!\n')

          await new Promise(r => setTimeout(r, 3000))

          // Demo 2: Unsend a message
          console.log('📤 Sending message to unsend...')
          const msg2 = await sdk.messages.sendMessage({
            chatGuid: chatGuid,
            message: 'Oops, I did not mean to send this!'
          })
          console.log(`✅ Sent: "${msg2.text}"\n`)

          await new Promise(r => setTimeout(r, 2000))

          console.log('🗑️  Unsending message...')
          await sdk.messages.unsendMessage({
            messageGuid: msg2.guid
          })
          console.log('✅ Message unsent! (disappeared from conversation)\n')

          console.log('🎉 Demo complete!')
          console.log('\n💡 Notes:')
          console.log('   • Edit: Works within 15 minutes of sending')
          console.log('   • Unsend: Works within 2 minutes of sending')
          console.log('   • Requires macOS Ventura (13.0) or newer')
          console.log('   • Both parties need compatible iOS/macOS versions\n')

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
