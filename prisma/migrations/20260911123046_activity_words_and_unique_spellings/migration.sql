-- CreateTable
CREATE TABLE "ActivityWord" (
    "activityId" INTEGER NOT NULL,
    "wordId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    PRIMARY KEY ("activityId", "wordId"),
    CONSTRAINT "ActivityWord_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ActivityConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Preserve data: each existing Wordle target word becomes the first word
-- of its activity before the old targetWordId column is removed below.
INSERT INTO "ActivityWord" ("activityId", "wordId", "position")
SELECT "id", "targetWordId", 0 FROM "ActivityConfig" WHERE "targetWordId" IS NOT NULL;

-- DropIndex
DROP INDEX "Word_wordListId_idx";


-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActivityConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "wordListId" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 5,
    "gridSize" INTEGER NOT NULL DEFAULT 10,
    "allowDiagonals" BOOLEAN NOT NULL DEFAULT false,
    "showHints" BOOLEAN NOT NULL DEFAULT true,
    "seed" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActivityConfig_wordListId_fkey" FOREIGN KEY ("wordListId") REFERENCES "WordList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ActivityConfig" ("allowDiagonals", "attempts", "createdAt", "difficulty", "gridSize", "id", "seed", "showHints", "title", "type", "updatedAt", "wordListId") SELECT "allowDiagonals", "attempts", "createdAt", "difficulty", "gridSize", "id", "seed", "showHints", "title", "type", "updatedAt", "wordListId" FROM "ActivityConfig";
DROP TABLE "ActivityConfig";
ALTER TABLE "new_ActivityConfig" RENAME TO "ActivityConfig";
CREATE INDEX "ActivityConfig_wordListId_idx" ON "ActivityConfig"("wordListId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ActivityWord_wordId_idx" ON "ActivityWord"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityWord_activityId_position_key" ON "ActivityWord"("activityId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Word_wordListId_english_key" ON "Word"("wordListId", "english");

