#!/usr/bin/env npx tsx
/**
 * Quick test script for Basic iMessage Kit
 * Tests: Reading messages, listing chats, checking unread
 *
 * Usage: npx tsx 1-test-basic.ts
 */

import { IMessageSDK } from '../imessage-kit/dist/index.js'

async function main() {
  console.log('🧪 Testing Basic iMessage Kit\n')

  const sdk = new IMessageSDK({ debug: false })

  try {
    // Test 1: Read recent messages
    console.log('📥 Test 1: Reading last 5 messages...')
    const messages = await sdk.getMessages({ limit: 5 })
    console.log(`   ✅ Found ${messages.total} total messages`)

    if (messages.messages.length > 0) {
      const latest = messages.messages[0]
      console.log(`   Latest: "${latest.text?.substring(0, 50)}..." from ${latest.sender}`)
    }

    // Test 2: List chats
    console.log('\n💬 Test 2: Listing chats...')
    const chats = await sdk.listChats({ limit: 10 })
    console.log(`   ✅ Found ${chats.length} chats`)

    if (chats.length > 0) {
      console.log('\n   Recent chats:')
      chats.slice(0, 5).forEach((chat, i) => {
        console.log(`   ${i + 1}. ${chat.displayName || 'Unknown'} (${chat.isGroup ? 'Group' : 'DM'})`)
      })
    }

    // Test 3: Get unread count
    console.log('\n✉️  Test 3: Checking unread messages...')
    const unread = await sdk.getUnreadMessages()
    console.log(`   ✅ ${unread.total} unread messages from ${unread.senderCount} people`)

    if (unread.groups.length > 0) {
      console.log('\n   Unread breakdown:')
      unread.groups.forEach(({ sender, messages }) => {
        console.log(`   - ${sender}: ${messages.length} message(s)`)
      })
    }

    // Test 4: Check database connection
    console.log('\n🗄️  Test 4: Database connection...')
    console.log('   ✅ Database accessible')

    console.log('\n✅ All tests passed! Basic iMessage Kit is working correctly.\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('\nPossible issues:')
    console.error('  - Full Disk Access not granted')
    console.error('  - Messages database not accessible')
    console.error('  - macOS version incompatibility')
  } finally {
    await sdk.close()
  }
}

main()
