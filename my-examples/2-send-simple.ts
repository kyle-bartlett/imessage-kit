#!/usr/bin/env npx tsx
/**
 * Simple send message example
 *
 * Usage:
 *   PHONE="+1234567890" npx tsx 2-send-simple.ts
 *   or edit the phoneNumber variable below
 */

import { IMessageSDK } from '../imessage-kit/dist/index.js'

async function main() {
  // ⚠️ CHANGE THIS to your phone number or email
  const phoneNumber = process.env.PHONE || '+1234567890'

  console.log(`📤 Sending message to: ${phoneNumber}\n`)

  const sdk = new IMessageSDK({ debug: true })

  try {
    // Send a simple text message
    const result = await sdk.send(phoneNumber, 'Hello! This is a test from iMessage Kit 👋')

    console.log('\n✅ Message sent successfully!')
    console.log('   Sent at:', result.sentAt)

    // If you want to send images
    // await sdk.send(phoneNumber, {
    //   text: 'Check out this image!',
    //   images: ['/Users/kylebartlett/Pictures/photo.jpg']
    // })

    // If you want to send files
    // await sdk.send(phoneNumber, {
    //   text: 'Here is a document',
    //   files: ['/Users/kylebartlett/Documents/file.pdf']
    // })

  } catch (error) {
    console.error('\n❌ Failed to send:', error.message)
  } finally {
    await sdk.close()
  }
}

main()
