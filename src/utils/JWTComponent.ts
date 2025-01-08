import { create, getNumericDate, verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { ExpiredTokenError } from './errors/httpErrors.ts';

// Create a CryptoKey from a string secret
const jwtSecret = await crypto.subtle.importKey(
	'raw',
	new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'secret'),
	{ name: 'HMAC', hash: 'SHA-512' },
	false,
	['sign', 'verify'],
);

/**
 * @param payload - The payload to be signed
 * @param expiresIn - The time in seconds for the token to expire e.g. 3600 for 1 hour
 * @returns
 */
export async function generateToken(
	payload: Record<string, unknown>,
	expiresIn = Number(Deno.env.get('JWT_EXPIRES') || '3600'),
): Promise<string> {
	const token = await create(
		{ alg: 'HS512', typ: 'JWT' },
		{ ...payload, exp: getNumericDate(Date.now() / 1000 + expiresIn) },
		jwtSecret,
	);
	return token;
}

/**
 * @param token - The token to be verified
 * @returns
 */
export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
	try {
		const payload = await verify(token, jwtSecret);
		return payload as Record<string, unknown>;
	} catch (err) {
		if (err instanceof Error && err.message === 'The jwt is expired.') {
			throw new ExpiredTokenError(err.message);
		}
		//console.error('Invalid token:', err);
		return null;
	}
}
