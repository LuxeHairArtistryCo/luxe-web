import { createHmac, timingSafeEqual } from 'node:crypto';

// Shared by both Square webhook routes (app/api/revalidate-square/route.ts
// for the main shared salon account, and
// app/api/revalidate-square/[artist]/route.ts for artists running their own
// independent Square account) — see Square's docs:
// https://developer.squareup.com/docs/webhooks/step3validate
//
// Square signs the exact notification URL + raw request body with the
// signing key generated for that specific webhook subscription. Callers are
// responsible for reading the raw body (before any JSON parsing — the HMAC
// won't match a re-stringified body) and for picking the right signing key.
export function verifySquareWebhookSignature(
	notificationUrl: string,
	rawBody: string,
	signature: string,
	signatureKey: string
): boolean {
	const expectedSignature = createHmac('sha256', signatureKey)
		.update(notificationUrl + rawBody)
		.digest('base64');

	const expected = Buffer.from(expectedSignature);
	const received = Buffer.from(signature);

	// Constant-time compare per Square's docs, to avoid a timing attack on the
	// signature check. timingSafeEqual throws on mismatched buffer lengths
	// rather than returning false, so the length check has to come first —
	// this is the same fast-fail pattern Square's own SDK helper uses.
	return expected.length === received.length && timingSafeEqual(expected, received);
}
