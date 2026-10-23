import JSZip from "jszip";

/**
 * Encodes a string to Base64.
 */
export function base64Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

/**
 * Decodes a Base64 string to a string.
 */
export function base64Decode(input: string): string {
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Computes the SHA-256 hash of the provided data and returns it as a hex string.
 */
export async function sha256(data: string | Uint8Array): Promise<string> {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", bytes.buffer);
  const hash = new Uint8Array(digest);
  const hex = Array.from(hash)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hex;
}

/**
 * Creates a ZIP archive from a set of files.
 */
export async function zip(
  files: Record<string, Uint8Array>,
): Promise<Uint8Array> {
  const bundle = new JSZip();
  for (const name of Object.keys(files)) {
    const data = files[name];
    if (data) {
      bundle.file(name, data);
    }
  }
  return bundle.generateAsync({ type: "uint8array" });
}
