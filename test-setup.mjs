#!/usr/bin/env node

// Simple test to verify iMessage Kit is working
import { IMessageSDK } from './imessage-kit/dist/index.js'

async function testSetup() {
  console.log('🧪 Testing iMessage Kit Setup...\n')

  try {
    const sdk = new IMessageSDK({ debug: false })
    console.log('✅ SDK initialized successfully')

    // Test 1: Database connection
    console.log('\n📥 Test 1: Reading recent messages...')
    const messages = await sdk.getMessages({ limit: 5 })
    console.log(`✅ Found ${messages.total} messages in database`)

    // Test 2: List chats
    console.log('\n💬 Test 2: Listing recent chats...')
    const chats = await sdk.listChats({ limit: 5 })
    console.log(`✅ Found ${chats.length} chats`)

    // Test 3: Unread messages
    console.log('\n✉️  Test 3: Checking unread messages...')
    const unread = await sdk.getUnreadMessages()
    console.log(`✅ Found ${unread.total} unread messages from ${unread.senderCount} senders`)

    await sdk.close()
    console.log('\n✅ SDK closed successfully')

    console.log('\n🎉 All tests passed! iMessage Kit is working correctly.')
    console.log('\n📚 Next steps:')
    console.log('   - Check SETUP_GUIDE.md for full documentation')
    console.log('   - Check QUICKSTART.md for quick examples')
    console.log('   - Check BIG_DOGS.md for advanced features')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testSetup()
