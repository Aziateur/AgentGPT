// PBKDF2 with SHA-256. Good enough for a demo app; still WAY better than nothing.
// Stores format: pbkdf2$<iter>$<saltHex>$<hashHex>

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const iter = 100_000;
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: iter },
    keyMaterial, 256
  );
  return `pbkdf2$${iter}$${toHex(salt)}$${toHex(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, iterStr, saltHex, hashHex] = stored.split("$");
    if (scheme !== "pbkdf2") return false;
    const iter = parseInt(iterStr, 10);
    const salt: Uint8Array = fromHex(saltHex);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: iter }, keyMaterial, 256);
    return toHex(new Uint8Array(bits)) === hashHex;
  } catch { return false; }
}

function toHex(a: Uint8Array): string { return Array.from(a).map(b => b.toString(16).padStart(2, "0")).join(""); }
function fromHex(s: string): Uint8Array { const a = new Uint8Array(s.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(s.substring(i * 2, i * 2 + 2), 16); return a; }
