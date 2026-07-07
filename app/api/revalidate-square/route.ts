import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createHmac, timingSafeEqual } from 'node:crypto';

// Square webhook for catalog.version.updated (see Square Developer Console ->
// your app -> Webhooks). Square fires this any time catalog data changes, so
// this route drops the 'square' fetch tag (see the Square fetches in
// app/[category]/[slug]/page.tsx) immediately instead of waiting for the
// 3600s time-based revalidate to expire on its own.
//
// This is set up as TWO separate subscriptions in the Square Developer
// Console — one with the production domain as its notification URL, one with
// the preview domain — each generates its own signature key. Rather than
// branching in code, this relies on the same trick already used for
// SANITY_WEBHOOK_SECRET: Vercel scopes env vars per environment, so
// SQUARE_WEBHOOK_SIGNATURE_KEY just holds a different value under Production
// vs Preview in Vercel, matching whichever subscription's key Square
// generated for that domain. Both environments hit this same route.
export async function POST(request: NextRequest) {
	const signature = request.headers.get('x-square-hmacsha256-signature');
	const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

	if (!signature || !signatureKey) {
		return NextResponse.json({ error: 'Missing signature or signing key' }, { status: 401 });
	}

	// Square computes its signature over the exact notification URL + raw
	// request body — reading the body as text (not parsing/re-stringifying
	// JSON) is required or the HMAC won't match.
	const rawBody = await request.text();
	const notificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate-square`;

	const expectedSignature = createHmac('sha256', signatureKey)
		.update(notificationUrl + rawBody)
		.digest('base64');

	const expected = Buffer.from(expectedSignature);
	const received = Buffer.from(signature);

	// Constant-time compare per Square's docs, to avoid a timing attack on the
	// signature check. timingSafeEqual throws on mismatched buffer lengths
	// rather than returning false, so the length check has to come first —
	// this is the same fast-fail pattern Square's own SDK helper uses.
	const isValid = expected.length === received.length && timingSafeEqual(expected, received);

	if (!isValid) {
		return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
	}

	// { expire: 0 } forces immediate expiration, same as /api/revalidate-sanity
	// for Sanity — the next request for services should get fresh Square data
	// instead of a stale-while-revalidate copy.
	revalidateTag('square', { expire: 0 });
	return NextResponse.json({ revalidated: true });
}
