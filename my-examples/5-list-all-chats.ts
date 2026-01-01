#!/usr/bin/env npx tsx
/**
 * List all your chats with details
 * Shows groups, DMs, and unread counts
 *
 * Usage: npx tsx 5-list-all-chats.ts
 */

import { IMessageSDK } from '../imessage-kit/dist/index.js'

async function main() {
  console.log('💬 Listing All Chats\n')

  const sdk = new IMessageSDK({ debug: false })

  try {
    // Get all chats
    const allChats = await sdk.listChats({ limit: 100 })

    // Separate groups and DMs
    const groups = allChats.filter(c => c.isGroup)
    const dms = allChats.filter(c => !c.isGroup)

    console.log(`📊 Found ${allChats.length} total chats:`)
    console.log(`   👥 ${groups.length} group chats`)
    console.log(`   💬 ${dms.length} direct messages\n`)

    // Display group chats
    if (groups.length > 0) {
      console.log('─'.repeat(70))
      console.log('👥 GROUP CHATS')
      console.log('─'.repeat(70))

      groups.forEach((chat, index) => {
        const lastMsg = chat.lastMessageAt
          ? new Date(chat.lastMessageAt).toLocaleString()
          : 'Never'

        console.log(`\n${index + 1}. ${chat.displayName || 'Unnamed Group'}`)
        console.log(`   Chat ID: ${chat.chatId}`)
        console.log(`   Last message: ${lastMsg}`)
        if (chat.unreadCount && chat.unreadCount > 0) {
          console.log(`   📬 Unread: ${chat.unreadCount}`)
        }
      })
      console.log()
    }

    // Display direct messages (show first 20)
    if (dms.length > 0) {
      console.log('─'.repeat(70))
      console.log('💬 DIRECT MESSAGES (showing first 20)')
      console.log('─'.repeat(70))

      dms.slice(0, 20).forEach((chat, index) => {
        const lastMsg = chat.lastMessageAt
          ? new Date(chat.lastMessageAt).toLocaleString()
          : 'Never'

        console.log(`\n${index + 1}. ${chat.displayName || 'Unknown'}`)
        console.log(`   Last message: ${lastMsg}`)
        if (chat.unreadCount && chat.unreadCount > 0) {
          console.log(`   📬 Unread: ${chat.unreadCount}`)
        }
      })
      console.log()
    }

    console.log('─'.repeat(70))
    console.log('\n💡 Tip: Use the chatId to send messages to groups:')
    console.log('   await sdk.send("chatId", "Hello group!")')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await sdk.close()
  }
}

main()
