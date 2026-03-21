import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || "default_local_secret_must_be_32by"; // Must be 32 bytes

export function encryptString(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  // Format: iv:authTag:encryptedText
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptString(encryptedPayload: string): string {
  if (!encryptedPayload) return "";
  try {
    const [ivHex, authTagHex, encryptedText] = encryptedPayload.split(":");
    if (!ivHex || !authTagHex || !encryptedText) return encryptedPayload; // Fallback if plain text or invalid
    
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    console.error("Decryption failed", e);
    return "";
  }
}
