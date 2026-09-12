import { prisma } from "@/lib/db";
import { handle, ok } from "@/lib/api";

/** GET /api/phonemes - the HCE phoneme inventory used for hints and validation. */
export function GET() {
  return handle(async () => {
    const phonemes = await prisma.phoneme.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return ok(phonemes);
  });
}
