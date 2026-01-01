#!/usr/bin/env npx tsx
/**
 * Send messages with visual effects
 * ADVANCED FEATURE - Requires Private API and Photon subscription
 *
 * Usage:
 *   CHAT="+1234567890" npx tsx 5-message-effects.ts
 */

import { SDK } from '../../advanced-imessage-kit/dist/index.js'
import config from '../../advanced-config.json'

async function main() {
  const chatGuid = process.env.CHAT || 'any;-;+1234567890'

  console.log('✨ Advanced: Message Effects\n')
  console.log(`📱 Chat: ${chatGuid}\n`)

  const sdk = SDK({ serverUrl: config.serverUrl, logLevel: 'info' })

  const effects = [
    { name: 'Confetti 🎉', id: 'com.apple.messages.effect.CKConfettiEffect' },
    { name: 'Fireworks 🎆', id: 'com.apple.messages.effect.CKFireworksEffect' },
    { name: 'Lasers ⚡', id: 'com.apple.messages.effect.CKLasersEffect' },
    { name: 'Shooting Star ⭐', id: 'com.apple.messages.effect.CKShootingStarEffect' },
    { name: 'Celebration 🎊', id: 'com.apple.messages.effect.CKSparklesEffect' },
    { name: 'Balloons 🎈', id: 'com.apple.messages.effect.CKHappyBirthdayEffect' },
    { name: 'Love Hearts 💕', id: 'com.apple.messages.effect.CKHeartEffect' }
  ]

  try {
    await sdk.connect()
    console.log('✅ Connected\n')

    await new Promise<void>((resolve) => {
      sdk.on('ready', async () => {
        try {
          console.log('🎨 Sending messages with different effects...\n')

          for (const effect of effects) {
            console.log(`✨ Sending with ${effect.name}...`)

            await sdk.messages.sendMessage({
              chatGuid: chatGuid,
              message: `This has ${effect.name} effect!`,
              effectId: effect.id
            })

            console.log(`   ✅ Sent!\n`)
            await new Promise(r => setTimeout(r, 2000))
          }

          console.log('🎉 All effects sent!')
          console.log('\n💡 Effect IDs for your reference:')
          effects.forEach(e => {
            console.log(`   ${e.name.padEnd(20)} ${e.id}`)
          })

          console.log('\n🎯 Usage example:')
          console.log(`   await sdk.messages.sendMessage({`)
          console.log(`     chatGuid: "${chatGuid}",`)
          console.log(`     message: "Happy Birthday! 🎂",`)
          console.log(`     effectId: "com.apple.messages.effect.CKHappyBirthdayEffect"`)
          console.log(`   })\n`)

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
