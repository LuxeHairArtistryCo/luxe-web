/**
 * Formats a phone number for display, e.g. "5195551234" -> "(519) 555-1234".
 * Handles a leading country code "1" (11 digits -> "+1 (519) 555-1234").
 * Anything that doesn't cleanly match a 10 or 11 digit North American number
 * (international numbers, extensions, etc.) is returned unchanged rather than
 * mangled — this is a display-only formatter, never used for the tel:/sms:
 * href itself, so it's safe to leave unusual input as-is.
 */
export function formatPhoneNumber(phone: string): string {
	const digits = phone.replace(/\D/g, '');

	if (digits.length === 10) {
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
	}

	if (digits.length === 11 && digits.startsWith('1')) {
		return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
	}

	return phone;
}
