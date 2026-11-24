import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function createPasswordHash(password, salt = randomBytes(16)) {
  const digest = createHash('sha256').update(salt).update('\0').update(password, 'utf8').digest()
  return { salt: salt.toString('base64'), hash: digest.toString('hex') }
}

export function verifyPassword(password, saltText, hashText) {
  try {
    const salt = Buffer.from(saltText, 'base64')
    const expected = Buffer.from(hashText, 'hex')
    if (salt.length !== 16 || expected.length !== 32) return false
    const actual = createHash('sha256').update(salt).update('\0').update(password, 'utf8').digest()
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function passwordPolicy(password) {
  return password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
}
