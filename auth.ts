import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';

// Konfiguriert NextAuth.js für die Authentifizierung.
// Beinhaltet den PrismaAdapter für die Datenbankintegration, Google als Authentifizierungsanbieter
// und einen Session-Callback, um die Benutzer-ID zur Session hinzuzufügen.
export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: PrismaAdapter(prisma),

	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
	],

	secret: process.env.AUTH_SECRET,

	callbacks: {
		/**
		 * Callback-Funktion, die aufgerufen wird, wenn eine Sitzung (Session) erstellt oder aktualisiert wird.
		 * Fügt die Benutzer-ID aus der Datenbank dem Session-Objekt hinzu.
		 * @param {object} params - Das Objekt mit Session- und Benutzerdaten.
		 * @param {import('next-auth').Session} params.session - Das aktuelle Session-Objekt.
		 * @param {import('next-auth').User | import('@auth/core/adapters').AdapterUser} params.user - Das Benutzerobjekt aus der Datenbank oder vom Adapter.
		 * @returns {Promise<import('next-auth').Session>} Das modifizierte Session-Objekt.
		 */
		async session({ session, user }) {
			if (session?.user) {
				session.user.id = user.id;
			}
			return session;
		},
	},
});
