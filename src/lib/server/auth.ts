import { SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/core/providers/github';
import Google from '@auth/core/providers/google';

// Note: PostgreSQL adapter initialization happens here, but actual DB connection
// is deferred until runtime to avoid errors during build. Database will be initialized
// in a separate server module for actual usage.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const { handle, signIn, signOut } = SvelteKitAuth(async (_event) => ({
	providers: [
		GitHub({
			clientId: process.env.AUTH_GITHUB_ID || '',
			clientSecret: process.env.AUTH_GITHUB_SECRET || ''
		}),
		Google({
			clientId: process.env.AUTH_GOOGLE_ID || '',
			clientSecret: process.env.AUTH_GOOGLE_SECRET || ''
		})
	],
	// adapter: PostgresAdapter(db), // Will be initialized in production with actual DB connection
	callbacks: {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		async signIn({ _user, _account, _profile }) {
			// Additional validation can be added here
			// Return true to allow sign in, false to deny
			return true;
		},
		async session({ session, user }) {
			// Add user ID to session for easy access
			if (session && user) {
				session.user.id = user.id;
			}
			return session;
		},
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		}
	},
	events: {
		async signIn({ user, account }) {
			// Log sign-in events for audit trail
			console.log(`User ${user?.email} signed in via ${account?.provider}`);
		},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		async signOut({ _token }) {
			// Log sign-out events
			console.log('User signed out');
		}
	},
	pages: {
		signIn: '/auth/signin',
		error: '/auth/error'
	},
	trustHost: process.env.AUTH_TRUST_HOST === 'true',
	secret: process.env.AUTH_SECRET
}));
