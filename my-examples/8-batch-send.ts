#!/usr/bin/env npx tsx
/**
 * Batch send messages to multiple people
 * Great for announcements to friends/family
 *
 * Usage: npx tsx 8-batch-send.ts
 */

import { IMessageSDK } from '../imessage-kit/dist/index.js'

async function main() {
  console.log('📢 Batch Message Sender\n')

  // ⚠️ EDIT THIS: Add your recipients
  const recipients = [
    '+1234567890',
    '+0987654321',
    'friend@example.com'
    // Add more recipients here
  ]

  // ⚠️ EDIT THIS: Change your message
  const message = 'Hey! Just testing out my new iMessage automation. Pretty cool right? 😎'

  console.log(`📝 Message: "${message}"`)
  console.log(`👥 Recipients: ${recipients.length} people\n`)

  // Confirm before sending
  console.log('⚠️  This will send the message to:')
  recipients.forEach((r, i) => console.log(`   ${i + 1}. ${r}`))

  console.log('\n💡 Edit the script to change recipients and message')
  console.log('   Press Ctrl+C within 5 seconds to cancel...\n')

  // 5 second countdown
  for (let i = 5; i > 0; i--) {
    process.stdout.write(`   Sending in ${i}...`)
    await new Promise(r => setTimeout(r, 1000))
    process.stdout.write('\r')
  }

  console.log('\n📤 Sending messages...\n')

  const sdk = new IMessageSDK({ debug: false, maxConcurrent: 3 })

  try {
    // Send to all recipients
    await sdk.sendBatch(
      recipients.map(phone => ({
        to: phone,
        content: message
      }))
    )

    console.log('✅ All messages sent successfully!\n')

    recipients.forEach((r, i) => {
      console.log(`   ${i + 1}. ✅ ${r}`)
    })

  } catch (error) {
    console.error('\n❌ Error sending messages:', error.message)
  } finally {
    await sdk.close()
  }
}

main()
