import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function GET(request: NextRequest) {
	// Secret is passed as a header (x-revalidate-secret) rather than a URL query
	// param, so it doesn't end up in browser history, proxy logs, or analytics.
	// Configure this same header in the Sanity webhook's "HTTP headers" field.
	const secret = request.headers.get('x-revalidate-secret');

	if (secret !== process.env.REVALIDATE_SECRET) {
		return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
	}

	// { expire: 0 } forces immediate expiration — appropriate here since this is
	// hit by the Sanity webhook and we want the next request to get fresh content,
	// not stale-while-revalidate (which 'max' would give).
	revalidateTag('sanity', { expire: 0 });
	return NextResponse.json({ revalidated: true });
}
