import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const generationReceiptSchema = z.object({
  requestId: z.string().uuid(),
  irChecksum: z.string().regex(/^[a-f0-9]{64}$/),
  diagramChecksum: z.string().regex(/^[a-f0-9]{64}$/),
  issuedAt: z.string().datetime(),
  signature: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
}).strict();

export type GenerationReceipt = z.infer<typeof generationReceiptSchema>;

function secret() {
  return process.env.GENERATION_RECEIPT_SECRET || process.env.RATE_LIMIT_HMAC_SECRET || "local-development-receipt-only";
}

function message(receipt: Omit<GenerationReceipt, "signature">) {
  return `${receipt.requestId}.${receipt.irChecksum}.${receipt.diagramChecksum}.${receipt.issuedAt}`;
}

function signature(receipt: Omit<GenerationReceipt, "signature">) {
  return createHmac("sha256", secret()).update(message(receipt)).digest("base64url");
}

export function createGenerationReceipt(input: Omit<GenerationReceipt, "issuedAt" | "signature">): GenerationReceipt {
  const unsigned = { ...input, issuedAt: new Date().toISOString() };
  return generationReceiptSchema.parse({ ...unsigned, signature: signature(unsigned) });
}

export function verifyGenerationReceipt(input: unknown, checksums: { ir: string; diagram: string }) {
  const receipt = generationReceiptSchema.parse(input);
  const expected = signature(receipt);
  const validSignature = timingSafeEqual(Buffer.from(receipt.signature), Buffer.from(expected));
  const age = Date.now() - new Date(receipt.issuedAt).getTime();
  if (!validSignature || age < -60_000 || age > 30 * 24 * 60 * 60_000 || receipt.irChecksum !== checksums.ir || receipt.diagramChecksum !== checksums.diagram) {
    throw new Error("Generation receipt validation failed.");
  }
  return receipt;
}
