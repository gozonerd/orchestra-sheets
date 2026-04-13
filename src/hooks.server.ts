import { handle as authHandle } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

// Auth.js handle wrapper
export const handle: Handle = authHandle;

// Sequence multiple handles if needed in future
// export const handle = sequence(authHandle, otherHandle);
