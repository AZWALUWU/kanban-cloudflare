// Native Web Crypto PBKDF2 helpers compatible with Cloudflare Workers runtime
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = new Uint8Array(16)
  crypto.getRandomValues(saltBytes)
  const saltHex = Array.from(saltBytes, b => b.toString(16).padStart(2, '0')).join('')

  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )

  const hashHex = Array.from(new Uint8Array(derived), b => b.toString(16).padStart(2, '0')).join('')
  return { hash: hashHex, salt: saltHex }
}

export async function verifyPassword(password: string, expectedHash: string, saltHex: string): Promise<boolean> {
  const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )

  const derivedHex = Array.from(new Uint8Array(derived), b => b.toString(16).padStart(2, '0')).join('')
  return derivedHex === expectedHash
}
