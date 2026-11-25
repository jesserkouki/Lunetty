export const LOCAL_FAVORITES_KEY = "lunetty:favorites";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isFavoriteProductId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
