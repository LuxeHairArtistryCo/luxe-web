import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { verifySquareWebhookSignature } from '@/lib/squareWebhook';

// Per-artist Square webhook — for artists who run their OWN independent
// Square account (their own terminal, their own app in the Square Developer
// Console) rather than sharing the main Luxe Hair Artistry account handled
// by app/api/revalidate-square/route.ts. A webhook subscription's signing
// key belongs to whichever Square account created it, so it can't be shared
// across accounts the way SQUARE_WEBHOOK_SIGNATURE_KEY is shared across the
// team members on the main account — each independent artist needs their
// own subscription (pointed at this route, with their slug in the URL) and
// their own signing key.
//
// Same Vercel Production/Preview environment-scoping trick used everywhere
// else in this file: SQUARE_WEBHOOK_SIGNATURE_KEY_<ARTIST> holds a
// different value per Vercel environment, matching that artist's prod vs
// preview subscription — see the README's "Square services & the Square
// webhook" section for the full setup checklist (per-artist subsection).
export async function POST(request: NextRequest, { params }: { params: Promise<{ artist: string }> }) {
	const { artist } = await params;

	// The notification URL (and therefore this slug) is something we choose
	// when creating the subscription in the Square Developer Console, not
	// arbitrary user input — but keep this narrow anyway, so a malformed slug
	// fails fast instead of being used to build an env var name.
	if (!/^[a-z0-9-]+$/.test(artist)) {
		return NextResponse.json({ error: 'Unknown artist' }, { status: 404 });
	}

	const envVarName = `SQUARE_WEBHOOK_SIGNATURE_KEY_${artist.toUpperCase().replace(/-/g, '_')}`;
	const signatureKey = process.env[envVarName];
	const signature = request.headers.get('x-square-hmacsha256-signature');

	if (!signature || !signatureKey) {
		return NextResponse.json({ error: 'Missing signature or signing key' }, { status: 401 });
	}

	// Square computes its signature over the exact notification URL + raw
	// request body — reading the body as text (not parsing/re-stringifying
	// JSON) is required or the HMAC won't match.
	const rawBody = await request.text();

	// Using the literal incoming request URL (rather than rebuilding it) so
	// this still matches Square's signature when the preview subscription's
	// notification URL has a ?x-vercel-protection-bypass=... query param
	// appended — see the "Square webhook" section in the README.
	const notificationUrl = request.url;

	if (!verifySquareWebhookSignature(notificationUrl, rawBody, signature, signatureKey)) {
		return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
	}

	// Narrower than the shared route's revalidateTag('square') — this
	// artist's catalog lives on their own independent Square account, so
	// only their own square-<slug> tagged fetches need to drop, not every
	// artist's. { expire: 0 } forces immediate expiration, same as the other
	// revalidate routes.
	revalidateTag(`square-${artist}`, { expire: 0 });
	return NextResponse.json({ revalidated: true });
}
