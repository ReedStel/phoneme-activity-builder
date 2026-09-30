import { prisma } from "@/lib/db";
import { handle, ok } from "@/lib/api";

/** GET /api/phonemes - the HCE phoneme inventory used for hints and validation. */
export function GET(req: Request) {
  return handle(req, async () => {
    const phonemes = await prisma.phoneme.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return ok(phonemes);
  });
}
