import { prisma } from "@/lib/db";
import { ApiError, handle, parseId } from "@/lib/api";
import { activityInclude, activityWordProblems } from "@/lib/activities";
import { buildWordleHtml, wordleFilename } from "@/lib/generate/wordle-html";
import { buildWordSearchHtml, wordSearchFilename } from "@/lib/generate/wordsearch-html";
import { toPhonemeWord } from "@/lib/serialize";
import type { ActivityType } from "@/lib/validation";
import { buildWordSearch } from "@/lib/wordsearch";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/activities/:id/generate
 *
 * Builds the standalone, playable HTML file for a saved activity entirely
 * from database data (its words, phonemes and settings) and returns it as a
 * download. Add ?inline=1 to open it in the browser instead.
 *
 * The word rules are checked again here because words can be edited or
 * deleted after an activity is saved.
 */
export function GET(req: Request, { params }: Ctx) {
  return handle(async () => {
    const id = parseId((await params).id);
    const inline = new URL(req.url).searchParams.get("inline") === "1";

    const activity = await prisma.activityConfig.findUnique({
      where: { id },
      include: activityInclude,
    });
    if (!activity) throw new ApiError(404, `Activity ${id} not found`);

    const type = activity.type as ActivityType;
    const words = activity.words.map((aw) => toPhonemeWord(aw.word));
    if (words.length === 0) {
      throw new ApiError(
        400,
        "This activity has no words left. They may have been deleted from the word list, so edit the activity and choose some words."
      );
    }
    const problems = activityWordProblems(type, words, activity.gridSize);
    if (problems.length) {
      throw new ApiError(400, "This activity needs fixing before it can be generated", problems);
    }

    let html: string;
    let filename: string;

    if (type === "WORDLE") {
      const config = {
        title: activity.title,
        words,
        attempts: activity.attempts,
        showHints: activity.showHints,
        difficulty: activity.difficulty,
      };
      html = buildWordleHtml(config);
      filename = wordleFilename(config);
    } else {
      const config = {
        title: activity.title,
        words,
        gridSize: activity.gridSize,
        allowDiagonals: activity.allowDiagonals,
        showHints: activity.showHints,
        seed: activity.seed,
        difficulty: activity.difficulty,
      };
      let grid;
      try {
        grid = buildWordSearch(words, activity.gridSize, activity.allowDiagonals, activity.seed);
      } catch {
        throw new ApiError(
          400,
          "Could not fit every word on the grid. Increase the grid size, allow diagonals, or choose fewer words."
        );
      }
      html = buildWordSearchHtml(config, grid);
      filename = wordSearchFilename(config);
    }

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        ...(inline ? {} : { "Content-Disposition": `attachment; filename="${filename}"` }),
      },
    });
  });
}
