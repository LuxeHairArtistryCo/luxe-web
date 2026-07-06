import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

// TODO (pre-launch): the Sanity webhook (sanity.io/manage -> API -> Webhooks)
// currently points at https://preview.luxehairartistry.ca/api/revalidate for
// testing. Before switching luxehairartistry.ca over to this Vercel deployment,
// update the webhook's URL field to the production domain, and confirm
// REVALIDATE_SECRET is set under the Production environment in Vercel.

// TEMP DEBUG — safely describes a secret's shape (length + first/last char)
// without ever logging the actual value. Remove once the 401 is sorted.
function describeSecret(value: string | null | undefined): string {
	if (value == null) return 'missing';
	if (value.length === 0) return 'empty string';
	return `len=${value.length} starts="${value[0]}" ends="${value[value.length - 1]}"`;
}

export async function GET(request: NextRequest) {
	// Secret is passed as a header (x-revalidate-secret) rather than a URL query
	// param, so it doesn't end up in browser history, proxy logs, or analytics.
	// Configure this same header in the Sanity webhook's "HTTP headers" field.
	const secret = request.headers.get('x-revalidate-secret');
	const expected = process.env.REVALIDATE_SECRET;

	// TEMP DEBUG — check Vercel's function logs (Project -> Logs, filter to
	// /api/revalidate) after a webhook attempt to see what actually arrived.
	console.log(
		'[revalidate] received:', describeSecret(secret),
		'| expected:', describeSecret(expected),
		'| match:', secret === expected
	);

	if (secret !== expected) {
		return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
	}

	// { expire: 0 } forces immediate expiration — appropriate here since this is
	// hit by the Sanity webhook and we want the next request to get fresh content,
	// not stale-while-revalidate (which 'max' would give).
	revalidateTag('sanity', { expire: 0 });
	return NextResponse.json({ revalidated: true });
}
