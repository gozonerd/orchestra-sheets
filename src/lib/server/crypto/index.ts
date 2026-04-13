import * as nacl from 'tweetnacl';
import pkg from 'tweetnacl-util';
import crypto from 'crypto';

const { encodeBase64, decodeBase64 } = pkg;

/**
 * Envelope Encryption Pattern
 *
 * Each user has a Data Encryption Key (DEK) derived from:
 * - Master Key (server secret in env)
 * - User ID (salts the DEK)
 *
 * API keys are encrypted with the user's DEK using XSalsa20-Poly1305
 * Encrypted blobs include nonce for decryption
 */

if (!process.env.ENCRYPTION_MASTER_KEY) {
	throw new Error(
		"ENCRYPTION_MASTER_KEY not set. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
	);
}

const MASTER_KEY = Buffer.from(process.env.ENCRYPTION_MASTER_KEY, 'base64');

if (MASTER_KEY.length !== 32) {
	throw new Error('ENCRYPTION_MASTER_KEY must be 32 bytes');
}

/**
 * Derive per-user DEK from master key + user ID
 * Uses PBKDF2 with 100,000 iterations for key stretching
 */
export function deriveUserDEK(userId: string): Uint8Array {
	const dek = crypto.pbkdf2Sync(MASTER_KEY, userId, 100000, 32, 'sha256');
	return new Uint8Array(dek);
}

/**
 * Encrypt plaintext with user's DEK
 * Returns encrypted blob with nonce prepended
 */
export function encryptKey(plaintext: string, userId: string): string {
	const dek = deriveUserDEK(userId);
	const nonce = nacl.randomBytes(24);
	const message = new Uint8Array(Buffer.from(plaintext, 'utf-8'));
	const encrypted = nacl.secretbox(message, nonce, dek);

	if (!encrypted) {
		throw new Error('Encryption failed');
	}

	// Prepend nonce to encrypted data for decryption
	const combined = new Uint8Array(nonce.length + encrypted.length);
	combined.set(nonce);
	combined.set(encrypted, nonce.length);

	return encodeBase64(combined);
}

/**
 * Decrypt ciphertext with user's DEK
 * Expects nonce prepended to ciphertext
 */
export function decryptKey(ciphertext: string, userId: string): string {
	const dek = deriveUserDEK(userId);
	const combined = decodeBase64(ciphertext);

	// Extract nonce and ciphertext
	const nonce = combined.slice(0, 24);
	const encrypted = combined.slice(24);

	const decrypted = nacl.secretbox.open(encrypted, nonce, dek);

	if (!decrypted) {
		throw new Error('Decryption failed - invalid key or corrupted data');
	}

	return Buffer.from(decrypted).toString('utf-8');
}

/**
 * Hash DEK to store with encrypted key for key derivation validation
 * Prevents using wrong master key or user ID
 */
export function hashDEK(userId: string): string {
	const dek = deriveUserDEK(userId);
	return crypto.createHash('sha256').update(dek).digest('base64');
}

/**
 * Validate DEK hash matches expected value
 */
export function validateDEKHash(userId: string, expectedHash: string): boolean {
	const currentHash = hashDEK(userId);
	return crypto.timingSafeEqual(Buffer.from(currentHash), Buffer.from(expectedHash));
}

/**
 * Generate a new cryptographic key (for generating test keys)
 */
export function generateSecureToken(length: number = 32): string {
	return encodeBase64(nacl.randomBytes(length));
}
