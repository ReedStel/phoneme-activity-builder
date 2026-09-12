-- CreateTable
CREATE TABLE "Phoneme" (
    "symbol" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "WordList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Word" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "english" TEXT NOT NULL,
    "wordListId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Word_wordListId_fkey" FOREIGN KEY ("wordListId") REFERENCES "WordList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WordPhoneme" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wordId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    CONSTRAINT "WordPhoneme_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WordPhoneme_symbol_fkey" FOREIGN KEY ("symbol") REFERENCES "Phoneme" ("symbol") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "wordListId" INTEGER NOT NULL,
    "targetWordId" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 5,
    "gridSize" INTEGER NOT NULL DEFAULT 10,
    "allowDiagonals" BOOLEAN NOT NULL DEFAULT false,
    "showHints" BOOLEAN NOT NULL DEFAULT true,
    "seed" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActivityConfig_wordListId_fkey" FOREIGN KEY ("wordListId") REFERENCES "WordList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityConfig_targetWordId_fkey" FOREIGN KEY ("targetWordId") REFERENCES "Word" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Word_wordListId_idx" ON "Word"("wordListId");

-- CreateIndex
CREATE INDEX "WordPhoneme_symbol_idx" ON "WordPhoneme"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "WordPhoneme_wordId_position_key" ON "WordPhoneme"("wordId", "position");

-- CreateIndex
CREATE INDEX "ActivityConfig_wordListId_idx" ON "ActivityConfig"("wordListId");
