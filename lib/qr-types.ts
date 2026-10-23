/** QR types and which ones need Pro. Pure, shared by the page and tests. */
export type QRType = "url" | "text" | "email" | "phone" | "sms" | "wifi" | "vcard";

export const FREE_TYPES: readonly QRType[] = ["url", "text"];
export const DEFAULT_FREE_TYPE: QRType = "url";

export function isFreeType(type: QRType): boolean {
  return FREE_TYPES.includes(type);
}

/** The type to keep selected once entitlement is known. Paid types fall back to URL without Pro. */
export function typeForEntitlement(type: QRType, isPro: boolean): QRType {
  return isPro || isFreeType(type) ? type : DEFAULT_FREE_TYPE;
}
