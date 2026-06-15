import type { ContactInfo } from '@/types/database'

function escapeVcard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function generateVCard(name: string, contact: ContactInfo): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVcard(name)}`,
  ]
  if (contact.phone)    lines.push(`TEL:${escapeVcard(contact.phone)}`)
  if (contact.email)    lines.push(`EMAIL:${escapeVcard(contact.email)}`)
  if (contact.location) lines.push(`ADR:;;${escapeVcard(contact.location)};;;;`)
  if (contact.website)  lines.push(`URL:${escapeVcard(contact.website)}`)
  if (contact.facebook)  lines.push(`X-SOCIALPROFILE;type=facebook:${escapeVcard(contact.facebook)}`)
  if (contact.instagram) lines.push(`X-SOCIALPROFILE;type=instagram:${escapeVcard(contact.instagram)}`)
  if (contact.x)         lines.push(`X-SOCIALPROFILE;type=x:${escapeVcard(contact.x)}`)
  if (contact.youtube)   lines.push(`X-SOCIALPROFILE;type=youtube:${escapeVcard(contact.youtube)}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export function downloadVCard(name: string, contact: ContactInfo): void {
  const vcf = generateVCard(name, contact)
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/[^a-z0-9]/gi, '_')}.vcf`
  a.click()
  URL.revokeObjectURL(url)
}
