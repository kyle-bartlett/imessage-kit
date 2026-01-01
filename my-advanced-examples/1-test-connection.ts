#!/usr/bin/env npx tsx
/**
 * Test Advanced iMessage Kit connection
 * Verifies your Photon subscription and server connection
 *
 * Usage: npx tsx 1-test-connection.ts
 */

import { SDK } from '../../advanced-imessage-kit/dist/index.js'
import config from '../../advanced-config.json'

async function main() {
  console.log('🚀 Testing Advanced iMessage Kit Connection\n')

  if (config.serverUrl === 'YOUR_SUBDOMAIN.imsgd.photon.codes') {
    console.log('❌ Configuration needed!')
    console.log('\n📝 Steps:')
    console.log('   1. Contact daniel@photon.codes to get your subdomain')
    console.log('   2. Edit /Users/kylebartlett/Documents/imessage-kit/advanced-config.json')
    console.log('   3. Replace YOUR_SUBDOMAIN with your actual subdomain')
    console.log('\nExample: "kyle.imsgd.photon.codes"\n')
    process.exit(1)
  }

  console.log(`🔌 Connecting to: ${config.serverUrl}\n`)

  const sdk = SDK({
    serverUrl: config.serverUrl,
    logLevel: 'debug'
  })

  try {
    // Connect to server
    await sdk.connect()
    console.log('✅ Socket connection established!\n')

    // Wait for ready event
    await new Promise<void>((resolve) => {
      sdk.on('ready', async () => {
        console.log('✅ SDK is ready!\n')

        try {
          // Test 1: Get server info
          console.log('📊 Test 1: Getting server info...')
          const serverInfo = await sdk.server.getServerInfo()
          console.log('   ✅ Server:', JSON.stringify(serverInfo, null, 2))

          // Test 2: Get chats
          console.log('\n💬 Test 2: Getting chats...')
          const chats = await sdk.chats.getChats()
          console.log(`   ✅ Found ${chats.length} chats`)

          // Test 3: Get message stats
          console.log('\n📈 Test 3: Getting message statistics...')
          const stats = await sdk.server.getMessageStats()
          console.log('   ✅ Stats:', JSON.stringify(stats, null, 2))

          console.log('\n🎉 All tests passed! Advanced iMessage Kit is working!\n')

          // Disconnect
          await sdk.disconnect()
          console.log('👋 Disconnected')
          resolve()

        } catch (error) {
          console.error('\n❌ Test failed:', error.message)
          await sdk.disconnect()
          process.exit(1)
        }
      })

      sdk.on('error', (error) => {
        console.error('\n❌ Connection error:', error.message)
        console.log('\nPossible issues:')
        console.log('  - Incorrect server URL')
        console.log('  - Subscription not active')
        console.log('  - Internet connection problems')
        process.exit(1)
      })
    })

  } catch (error) {
    console.error('\n❌ Failed to connect:', error.message)
    process.exit(1)
  }

  process.exit(0)
}

main()
