#!/usr/bin/env npx tsx
/**
 * Google Calendar OAuth Setup
 *
 * Run this ONCE to authenticate with Google Calendar.
 * It will open a browser for you to authorize, then save the tokens.
 *
 * Usage: npx tsx setup-google-calendar.ts
 */

import { google } from 'googleapis'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { URL } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CREDENTIALS_PATH = resolve(__dirname, 'google-credentials.json')
const TOKEN_PATH = resolve(__dirname, 'google-token.json')
// Need both read AND write access for event creation
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
]

async function authenticate() {
  // Load credentials
  if (!existsSync(CREDENTIALS_PATH)) {
    console.error('❌ google-credentials.json not found!')
    console.error('   Download OAuth credentials from Google Cloud Console')
    process.exit(1)
  }

  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'))
  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/callback'
  )

  // Check if we already have tokens
  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'))
    oAuth2Client.setCredentials(token)
    console.log('✅ Already authenticated! Token exists at:')
    console.log(`   ${TOKEN_PATH}`)

    // Test the connection
    try {
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })
      const res = await calendar.calendarList.list({ maxResults: 1 })
      console.log('\n✅ Calendar connection working!')
      console.log('   You can now run kyle-assistant.ts with calendar support.')
      return
    } catch (e: any) {
      console.log('\n⚠️  Token may be expired. Re-authenticating...\n')
    }
  }

  // Generate auth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  })

  console.log('🔐 Google Calendar Authentication')
  console.log('━'.repeat(50))
  console.log('\n1. A browser will open for you to sign in')
  console.log('2. Grant calendar access when prompted')
  console.log('3. You\'ll be redirected back here automatically\n')

  // Start local server to receive callback
  const server = createServer(async (req, res) => {
    if (req.url?.startsWith('/callback')) {
      const url = new URL(req.url, 'http://localhost:3000')
      const code = url.searchParams.get('code')

      if (code) {
        try {
          const { tokens } = await oAuth2Client.getToken(code)
          oAuth2Client.setCredentials(tokens)

          // Save tokens
          writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2))

          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 50px; text-align: center;">
                <h1>✅ Success!</h1>
                <p>Google Calendar connected. You can close this window.</p>
                <p>Return to your terminal to continue.</p>
              </body>
            </html>
          `)

          console.log('✅ Authentication successful!')
          console.log(`   Token saved to: ${TOKEN_PATH}`)
          console.log('\n🎉 You can now run kyle-assistant.ts with calendar support!')

          setTimeout(() => {
            server.close()
            process.exit(0)
          }, 1000)

        } catch (err: any) {
          res.writeHead(500)
          res.end('Authentication failed: ' + err.message)
          console.error('❌ Failed to get tokens:', err.message)
        }
      } else {
        res.writeHead(400)
        res.end('No authorization code received')
      }
    } else {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  server.listen(3000, () => {
    console.log('🌐 Opening browser for authentication...\n')

    // Open browser
    const { exec } = require('child_process')
    exec(`open "${authUrl}"`)

    console.log('If browser doesn\'t open, visit this URL:')
    console.log(authUrl)
    console.log('\n⏳ Waiting for authentication...\n')
  })
}

authenticate().catch(console.error)
