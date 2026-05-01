/**
 * One-time backfill: generate livenotes JSON for all songcode notes that have content.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<your-key> npx tsx scripts/backfill-songcode-json.ts
 *
 * Get your service role key from: Supabase dashboard → Settings → API → service_role
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { SongCodeConverter } from '@livenotes/songcode-converter'

// Load VITE_SUPABASE_URL from .env
const envPath = resolve(process.cwd(), '.env')
const envLines = readFileSync(envPath, 'utf-8').split('\n')
const env: Record<string, string> = {}
for (const line of envLines) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const supabaseUrl = env['VITE_SUPABASE_URL']
const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL not found in .env')
  process.exit(1)
}
if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env variable is required')
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/backfill-songcode-json.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

const converter = new SongCodeConverter()

async function run() {
  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, content, data')
    .eq('type', 'songcode')
    .not('content', 'is', null)
    .neq('content', '')

  if (error) throw error

  console.log(`Found ${notes.length} songcode notes with content`)

  let ok = 0
  let failed = 0

  for (const note of notes) {
    try {
      const json = converter.convert(note.content)
      const { error: updateError } = await supabase
        .from('notes')
        .update({
          data: {
            livenotes_json: json,
            livenotes_json_updated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', note.id)

      if (updateError) throw updateError
      console.log(`  ✓ ${note.id}`)
      ok++
    } catch (err) {
      console.error(`  ✗ ${note.id}: ${err instanceof Error ? err.message : err}`)
      failed++
    }
  }

  console.log(`\nDone: ${ok} updated, ${failed} failed`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
