#!/usr/bin/env npx tsx
/**
 * Download all images from a specific person
 *
 * Usage:
 *   PHONE="+1234567890" npx tsx 9-download-images.ts
 */

import { IMessageSDK, downloadAttachment, isImageAttachment } from '../imessage-kit/dist/index.js'
import { mkdirSync } from 'fs'
import { join } from 'path'

async function main() {
  // ⚠️ CHANGE THIS to the person's phone/email
  const phoneNumber = process.env.PHONE || '+1234567890'
  const outputDir = `/Users/kylebartlett/Downloads/imessage-images-${Date.now()}`

  console.log(`📷 Downloading images from: ${phoneNumber}\n`)

  const sdk = new IMessageSDK({ debug: false })

  try {
    // Create output directory
    mkdirSync(outputDir, { recursive: true })
    console.log(`📁 Saving to: ${outputDir}\n`)

    // Get messages with attachments
    const messages = await sdk.getMessages({
      sender: phoneNumber,
      hasAttachments: true,
      limit: 500
    })

    console.log(`📊 Found ${messages.total} messages with attachments`)

    let imageCount = 0
    let skipped = 0

    for (const msg of messages.messages) {
      for (const att of msg.attachments) {
        if (isImageAttachment(att)) {
          try {
            // Generate filename with timestamp
            const timestamp = msg.date.getTime()
            const ext = att.filename?.split('.').pop() || 'jpg'
            const filename = `image_${timestamp}_${imageCount}.${ext}`
            const filepath = join(outputDir, filename)

            // Download image
            await downloadAttachment(att, filepath)
            imageCount++

            process.stdout.write(`\r📥 Downloaded: ${imageCount} images...`)
          } catch (err) {
            skipped++
          }
        }
      }
    }

    console.log(`\n\n✅ Download complete!`)
    console.log(`   📷 Downloaded: ${imageCount} images`)
    if (skipped > 0) {
      console.log(`   ⏭️  Skipped: ${skipped} (file not found or error)`)
    }
    console.log(`\n📂 Open folder: ${outputDir}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await sdk.close()
  }
}

main()
