#!/usr/bin/env npx tsx
/**
 * Search messages by keyword/text
 *
 * Usage:
 *   SEARCH="meeting" npx tsx 6-search-messages.ts
 *   or edit the searchTerm variable below
 */

import { IMessageSDK } from '../imessage-kit/dist/index.js'

async function main() {
  // ⚠️ CHANGE THIS to search for different terms
  const searchTerm = process.env.SEARCH || 'hello'

  console.log(`🔍 Searching for messages containing: "${searchTerm}"\n`)

  const sdk = new IMessageSDK({ debug: false })

  try {
    // Search messages
    const results = await sdk.getMessages({
      search: searchTerm,
      limit: 50
    })

    if (results.total === 0) {
      console.log(`❌ No messages found containing "${searchTerm}"`)
      return
    }

    console.log(`✅ Found ${results.total} messages\n`)
    console.log('─'.repeat(70))

    // Display results
    results.messages.forEach((msg, index) => {
      const timestamp = msg.date.toLocaleString()
      const direction = msg.isFromMe ? '→' : '←'

      console.log(`\n${index + 1}. ${direction} ${msg.isFromMe ? 'You' : msg.sender}`)
      console.log(`   [${timestamp}]`)
      console.log(`   ${msg.text}`)

      if (msg.attachments.length > 0) {
        console.log(`   📎 ${msg.attachments.length} attachment(s)`)
      }
    })

    console.log('\n' + '─'.repeat(70))

    // Show breakdown by sender
    const bySender = new Map<string, number>()
    results.messages.forEach(msg => {
      const sender = msg.isFromMe ? 'You' : msg.sender
      bySender.set(sender, (bySender.get(sender) || 0) + 1)
    })

    console.log('\n📊 Breakdown by sender:')
    Array.from(bySender.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([sender, count]) => {
        console.log(`   ${sender}: ${count} message(s)`)
      })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await sdk.close()
  }
}

main()
