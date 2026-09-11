/**
 * Server-side phoneme existence check against the Phoneme inventory table.
 * Returns nothing on success; throws a 400 ApiError naming every unknown
 * symbol so the teacher can see exactly what to fix.
 */

import { prisma } from "./db";
import { ApiError } from "./api";

export async function assertPhonemesExist(symbols: string[]): Promise<void> {
  const unique = [...new Set(symbols)];
  if (unique.length === 0) return;
  const known = await prisma.phoneme.findMany({
    where: { symbol: { in: unique } },
    select: { symbol: true },
  });
  const knownSet = new Set(known.map((k) => k.symbol));
  const unknown = unique.filter((s) => !knownSet.has(s));
  if (unknown.length) {
    throw new ApiError(
      400,
      "Unknown phoneme symbol(s)",
      unknown.map(
        (s) =>
          `"${s}" is not in the HCE phoneme inventory. Use the phoneme keyboard, or GET /api/phonemes for the valid list.`
      )
    );
  }
}
