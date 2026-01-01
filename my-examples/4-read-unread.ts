#!/usr/bin/env npx tsx
/**
 * Read and display all unread messages
 * Optionally send auto-reply to acknowledge
 *
 * Usage: npx tsx 4-read-unread.ts
 */

import { IMessageSDK } from '../imessage-kit/dist/index.js'

async function main() {
  console.log('📬 Reading Unread Messages\n')

  const sdk = new IMessageSDK({ debug: false })

  try {
    // Get all unread messages, grouped by sender
    const unread = await sdk.getUnreadMessages()

    if (unread.total === 0) {
      console.log('✅ No unread messages! You\'re all caught up.')
      return
    }

    console.log(`📊 Summary: ${unread.total} unread messages from ${unread.senderCount} people\n`)
    console.log('─'.repeat(60))

    // Display unread messages grouped by sender
    for (const { sender, messages } of unread.groups) {
      console.log(`\n👤 ${sender} (${messages.length} message${messages.length > 1 ? 's' : ''})`)
      console.log('─'.repeat(60))

      messages.forEach((msg, index) => {
        const timestamp = msg.date.toLocaleString()
        const preview = msg.text?.substring(0, 100) || '[No text]'

        console.log(`\n   ${index + 1}. [${timestamp}]`)
        console.log(`      ${preview}${msg.text && msg.text.length > 100 ? '...' : ''}`)

        if (msg.attachments.length > 0) {
          console.log(`      📎 ${msg.attachments.length} attachment(s)`)
        }
      })

      console.log()

      // Uncomment to send auto-acknowledgment
      // console.log(`   💬 Sending acknowledgment to ${sender}...`)
      // await sdk.send(sender, 'Thanks for your message! I\'ll get back to you soon.')
      // console.log('   ✅ Acknowledgment sent\n')
    }

    console.log('─'.repeat(60))
    console.log('\n✅ Finished reading unread messages')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await sdk.close()
  }
}

main()
