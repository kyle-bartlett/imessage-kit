#!/usr/bin/env npx tsx
/**
 * Fun message statistics - see who you text the most!
 *
 * Usage: npx tsx 7-fun-stats.ts
 */

import { IMessageSDK } from '../imessage-kit/dist/index.js'

async function main() {
  console.log('📊 Your Messaging Statistics\n')

  const sdk = new IMessageSDK({ debug: false })

  try {
    // Get messages from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const messages = await sdk.getMessages({
      since: thirtyDaysAgo,
      limit: 10000,
      excludeOwnMessages: false
    })

    console.log(`📅 Last 30 days: ${messages.total} total messages\n`)

    // Count by sender
    const bySender = new Map<string, { sent: number; received: number }>()

    messages.messages.forEach(msg => {
      if (msg.isFromMe) {
        // Messages you sent
        const key = msg.sender || msg.chatId
        const stats = bySender.get(key) || { sent: 0, received: 0 }
        stats.sent++
        bySender.set(key, stats)
      } else {
        // Messages you received
        const key = msg.sender
        const stats = bySender.get(key) || { sent: 0, received: 0 }
        stats.received++
        bySender.set(key, stats)
      }
    })

    // Calculate total messages per person
    const totals = Array.from(bySender.entries()).map(([person, stats]) => ({
      person,
      sent: stats.sent,
      received: stats.received,
      total: stats.sent + stats.received
    }))

    // Sort by most messages
    totals.sort((a, b) => b.total - a.total)

    // Display top 10
    console.log('━'.repeat(70))
    console.log('👥 TOP 10 PEOPLE YOU TEXT WITH')
    console.log('━'.repeat(70))

    totals.slice(0, 10).forEach((person, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
      console.log(`\n${medal} ${person.person}`)
      console.log(`   📤 Sent: ${person.sent} | 📥 Received: ${person.received} | 💬 Total: ${person.total}`)

      // Calculate who texts more
      const youTextMore = person.sent > person.received
      const diff = Math.abs(person.sent - person.received)
      const percentage = ((diff / person.total) * 100).toFixed(0)

      if (diff > 5) {
        const who = youTextMore ? 'You' : 'They'
        console.log(`   ${youTextMore ? '📱' : '📲'} ${who} text more (${percentage}% difference)`)
      }
    })

    console.log('\n' + '━'.repeat(70))

    // Overall stats
    const totalSent = totals.reduce((sum, p) => sum + p.sent, 0)
    const totalReceived = totals.reduce((sum, p) => sum + p.received, 0)

    console.log('\n📈 OVERALL STATS')
    console.log('━'.repeat(70))
    console.log(`📤 You sent: ${totalSent} messages`)
    console.log(`📥 You received: ${totalReceived} messages`)
    console.log(`📊 Total conversations: ${totals.length} people`)
    console.log(`📅 Average per day: ${Math.round(messages.total / 30)} messages`)

    // Fun facts
    console.log('\n🎉 FUN FACTS')
    console.log('━'.repeat(70))

    if (totalSent > totalReceived) {
      const diff = ((totalSent - totalReceived) / messages.total * 100).toFixed(0)
      console.log(`🗣️  You're a talker! You send ${diff}% more messages than you receive`)
    } else {
      const diff = ((totalReceived - totalSent) / messages.total * 100).toFixed(0)
      console.log(`👂 You're a good listener! You receive ${diff}% more messages than you send`)
    }

    const topPerson = totals[0]
    const topPercentage = ((topPerson.total / messages.total) * 100).toFixed(0)
    console.log(`💕 ${topPerson.person} is your #1 - ${topPercentage}% of all your messages!`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await sdk.close()
  }
}

main()
