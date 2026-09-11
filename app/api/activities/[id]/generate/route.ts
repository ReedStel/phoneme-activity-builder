import { prisma } from "@/lib/db";
import { ApiError, handle, parseId } from "@/lib/api";
import { buildWordleHtml, wordleFilename } from "@/lib/generate/wordle-html";
import { buildWordSearchHtml, wordSearchFilename } from "@/lib/generate/wordsearch-html";
import { wordInclude, toPhonemeWord } from "@/lib/serialize";
import { buildWordSearch } from "@/lib/wordsearch";

type Ctx = { params: Promise<{ id: string }> };

function htmlDownload(html: string, filename: string) {
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * GET /api/activities/:id/generate
 * Builds the standalone, playable HTML file for a saved activity entirely
 * from database data (word list, target word, settings) and returns it as a
 * download. Add ?inline=1 to view it in the browser instead.
 */
export function GET(req: Request, { params }: Ctx) {
  return handle(async () => {
    const id = parseId((await params).id);
    const inline = new URL(req.url).searchParams.get("inline") === "1";

    const activity = await prisma.activityConfig.findUnique({
      where: { id },
      include: {
        wordList: { include: { words: { include: wordInclude, orderBy: { id: "asc" } } } },
        targetWord: { include: wordInclude },
      },
    });
    if (!activity) throw new ApiError(404, `Activity ${id} not found`);

    let html: string;
    let filename: string;

    if (activity.type === "WORDLE") {
      if (!activity.targetWord) {
        throw new ApiError(400, "This Wordle activity has no target word. Edit it and choose one.");
      }
      const config = {
        title: activity.title,
        word: toPhonemeWord(activity.targetWord),
        attempts: activity.attempts,
        showHints: activity.showHints,
      };
      html = buildWordleHtml(config);
      filename = wordleFilename(config);
    } else {
      const words = activity.wordList.words.map(toPhonemeWord);
      if (words.length === 0) {
        throw new ApiError(400, "The word list for this activity is empty. Add some words first.");
      }
      const longest = Math.max(...words.map((w) => w.phonemes.length));
      if (longest > activity.gridSize) {
        throw new ApiError(
          400,
          `The longest word has ${longest} phonemes but the grid is only ${activity.gridSize} wide. Increase the grid size.`
        );
      }
      const config = {
        title: activity.title,
        words,
        gridSize: activity.gridSize,
        allowDiagonals: activity.allowDiagonals,
        showHints: activity.showHints,
        seed: activity.seed,
      };
      let grid;
      try {
        grid = buildWordSearch(words, activity.gridSize, activity.allowDiagonals, activity.seed);
      } catch {
        throw new ApiError(
          400,
          "Could not fit every word on the grid. Increase the grid size or use fewer words."
        );
      }
      html = buildWordSearchHtml(config, grid);
      filename = wordSearchFilename(config);
    }

    if (inline) {
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
    return htmlDownload(html, filename);
  });
}
