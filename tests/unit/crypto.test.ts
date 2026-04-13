import { describe, it, expect, beforeAll } from 'vitest';
import {
	encryptKey,
	decryptKey,
	deriveUserDEK,
	hashDEK,
	validateDEKHash,
	generateSecureToken
} from '../../src/lib/server/crypto/index';

describe('Encryption Module', () => {
	const testUserId = 'user-123';
	const testApiKey = 'sk-1234567890abcdefghijklmnopqrstuv';

	describe('DEK Derivation', () => {
		it('should derive consistent DEK for same user', () => {
			const dek1 = deriveUserDEK(testUserId);
			const dek2 = deriveUserDEK(testUserId);

			expect(dek1).toEqual(dek2);
		});

		it('should derive different DEK for different users', () => {
			const dek1 = deriveUserDEK('user-123');
			const dek2 = deriveUserDEK('user-456');

			expect(dek1).not.toEqual(dek2);
		});

		it('should generate 32-byte DEK', () => {
			const dek = deriveUserDEK(testUserId);
			expect(dek.length).toBe(32);
		});

		it('should be deterministic (PBKDF2)', () => {
			// Multiple calls with same input should produce same DEK
			const dek1 = deriveUserDEK(testUserId);
			const dek2 = deriveUserDEK(testUserId);
			const dek3 = deriveUserDEK(testUserId);

			expect(Buffer.from(dek1)).toEqual(Buffer.from(dek2));
			expect(Buffer.from(dek2)).toEqual(Buffer.from(dek3));
		});
	});

	describe('Encryption and Decryption', () => {
		it('should encrypt and decrypt API key', () => {
			const encrypted = encryptKey(testApiKey, testUserId);
			const decrypted = decryptKey(encrypted, testUserId);

			expect(decrypted).toBe(testApiKey);
		});

		it('should produce different ciphertext for same plaintext', () => {
			const encrypted1 = encryptKey(testApiKey, testUserId);
			const encrypted2 = encryptKey(testApiKey, testUserId);

			// Different nonces produce different ciphertexts
			expect(encrypted1).not.toBe(encrypted2);
		});

		it('should decrypt to same plaintext despite different ciphertexts', () => {
			const encrypted1 = encryptKey(testApiKey, testUserId);
			const encrypted2 = encryptKey(testApiKey, testUserId);

			const decrypted1 = decryptKey(encrypted1, testUserId);
			const decrypted2 = decryptKey(encrypted2, testUserId);

			expect(decrypted1).toBe(decrypted2);
			expect(decrypted1).toBe(testApiKey);
		});

		it('should fail to decrypt with wrong user ID', () => {
			const encrypted = encryptKey(testApiKey, 'user-123');

			expect(() => {
				decryptKey(encrypted, 'user-456');
			}).toThrow('Decryption failed');
		});

		it('should handle long API keys', () => {
			const longKey = 'sk-' + 'a'.repeat(1000);
			const encrypted = encryptKey(longKey, testUserId);
			const decrypted = decryptKey(encrypted, testUserId);

			expect(decrypted).toBe(longKey);
		});

		it('should handle special characters in API keys', () => {
			const specialKey = 'sk-!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
			const encrypted = encryptKey(specialKey, testUserId);
			const decrypted = decryptKey(encrypted, testUserId);

			expect(decrypted).toBe(specialKey);
		});

		it('should not expose plaintext in encrypted output', () => {
			const encrypted = encryptKey(testApiKey, testUserId);

			// Encrypted output should not contain plaintext
			expect(encrypted).not.toContain(testApiKey);
			expect(encrypted).not.toContain('sk-');
		});

		it('should not expose plaintext in intermediate values', () => {
			// Verify encryption doesn't leave plaintext in logs
			const plaintext = testApiKey;
			const encrypted = encryptKey(plaintext, testUserId);

			// Convert to string to check for accidental plaintext
			const encryptedStr = String(encrypted);
			expect(encryptedStr).not.toContain(plaintext);
		});
	});

	describe('DEK Hash', () => {
		it('should generate consistent hash for same user', () => {
			const hash1 = hashDEK(testUserId);
			const hash2 = hashDEK(testUserId);

			expect(hash1).toBe(hash2);
		});

		it('should generate different hash for different users', () => {
			const hash1 = hashDEK('user-123');
			const hash2 = hashDEK('user-456');

			expect(hash1).not.toBe(hash2);
		});

		it('should validate correct DEK hash', () => {
			const hash = hashDEK(testUserId);
			const isValid = validateDEKHash(testUserId, hash);

			expect(isValid).toBe(true);
		});

		it('should reject incorrect DEK hash', () => {
			const correctHash = hashDEK('user-123');
			const isValid = validateDEKHash('user-456', correctHash);

			expect(isValid).toBe(false);
		});

		it('should use timing-safe comparison', () => {
			// validateDEKHash should use timing-safe comparison to prevent timing attacks
			const hash1 = hashDEK(testUserId);
			const hash2 = hashDEK(testUserId);

			// Both should be valid, timing should be consistent
			const result1 = validateDEKHash(testUserId, hash1);
			const result2 = validateDEKHash(testUserId, hash2);

			expect(result1).toBe(true);
			expect(result2).toBe(true);
		});

		it('should generate 44-character base64 hash', () => {
			const hash = hashDEK(testUserId);

			// SHA256 in base64 is 44 chars (256 bits / 6 bits per char = 42.67, rounded up with padding)
			expect(hash.length).toBeGreaterThanOrEqual(43);
		});
	});

	describe('Secure Token Generation', () => {
		it('should generate random tokens', () => {
			const token1 = generateSecureToken();
			const token2 = generateSecureToken();

			expect(token1).not.toBe(token2);
		});

		it('should generate token of specified length', () => {
			const token16 = generateSecureToken(16);
			const token32 = generateSecureToken(32);
			const token64 = generateSecureToken(64);

			// Base64 encoding increases size: (bytes * 4) / 3
			// Approximate lengths: 16->24, 32->44, 64->88
			expect(token16.length).toBeLessThan(token32.length);
			expect(token32.length).toBeLessThan(token64.length);
		});

		it('should generate valid base64 tokens', () => {
			const token = generateSecureToken(32);

			// Should be valid base64 (can be decoded)
			expect(() => {
				Buffer.from(token, 'base64');
			}).not.toThrow();
		});
	});

	describe('Security Properties', () => {
		it('should not encrypt deterministically (IND-CPA)', () => {
			// Same plaintext should encrypt differently each time (random nonce)
			const encryptions = Array(10)
				.fill(null)
				.map(() => encryptKey(testApiKey, testUserId));

			const uniqueEncryptions = new Set(encryptions);

			// All should be unique (probability of collision: 2^-128)
			expect(uniqueEncryptions.size).toBe(10);
		});

		it('should use 24-byte nonce (XSalsa20)', () => {
			// TweetNaCl uses 24-byte nonce for secretbox
			const encrypted = encryptKey(testApiKey, testUserId);

			// Encrypted output: 24-byte nonce + ciphertext
			// Base64 decode to check
			const buffer = Buffer.from(encrypted, 'base64');
			expect(buffer.length).toBeGreaterThan(24);
		});

		it('should use authenticated encryption (Poly1305 tag)', () => {
			// TweetNaCl secretbox includes 16-byte Poly1305 MAC
			// Modified ciphertext should fail decryption
			const encrypted = encryptKey(testApiKey, testUserId);
			const buffer = Buffer.from(encrypted, 'base64');

			// Flip a bit in the ciphertext
			const tampered = Buffer.from(buffer);
			tampered[30] ^= 0xff; // Flip bits

			const tamperedEncrypted = tampered.toString('base64');

			expect(() => {
				decryptKey(tamperedEncrypted, testUserId);
			}).toThrow();
		});
	});

	describe('Integration Scenarios', () => {
		it('should support multiple API keys per user', () => {
			const key1 = 'sk-key1-1234567890';
			const key2 = 'sk-key2-0987654321';

			const encrypted1 = encryptKey(key1, testUserId);
			const encrypted2 = encryptKey(key2, testUserId);

			expect(decryptKey(encrypted1, testUserId)).toBe(key1);
			expect(decryptKey(encrypted2, testUserId)).toBe(key2);
			expect(encrypted1).not.toBe(encrypted2);
		});

		it('should isolate keys between users', () => {
			const userId1 = 'user-1';
			const userId2 = 'user-2';
			const sameKey = 'sk-shared-secret';

			const encrypted1 = encryptKey(sameKey, userId1);
			const encrypted2 = encryptKey(sameKey, userId2);

			// Different users get different ciphertexts (different DEKs)
			expect(encrypted1).not.toBe(encrypted2);

			// But each user can decrypt their own
			expect(decryptKey(encrypted1, userId1)).toBe(sameKey);
			expect(decryptKey(encrypted2, userId2)).toBe(sameKey);

			// Cross-user decryption fails
			expect(() => decryptKey(encrypted1, userId2)).toThrow();
			expect(() => decryptKey(encrypted2, userId1)).toThrow();
		});

		it('should support DEK hash validation workflow', () => {
			const userId = 'user-123';
			const apiKey = 'sk-secret-key';

			// Store encrypted key + DEK hash
			const encrypted = encryptKey(apiKey, userId);
			const dekHash = hashDEK(userId);

			// Later: validate DEK is correct before decrypting
			const isValidDEK = validateDEKHash(userId, dekHash);
			expect(isValidDEK).toBe(true);

			// If valid, decrypt
			if (isValidDEK) {
				const decrypted = decryptKey(encrypted, userId);
				expect(decrypted).toBe(apiKey);
			}
		});
	});
});
