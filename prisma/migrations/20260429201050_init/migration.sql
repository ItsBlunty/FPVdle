-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "aliases" TEXT[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Puzzle" (
    "id" SERIAL NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "answerId" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Puzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clue" (
    "id" SERIAL NOT NULL,
    "puzzleId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "caption" TEXT,

    CONSTRAINT "Clue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Play" (
    "id" SERIAL NOT NULL,
    "puzzleId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "cluesUsed" INTEGER NOT NULL,
    "solved" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Puzzle_publishDate_key" ON "Puzzle"("publishDate");

-- CreateIndex
CREATE UNIQUE INDEX "Clue_puzzleId_position_key" ON "Clue"("puzzleId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Play_puzzleId_sessionId_key" ON "Play"("puzzleId", "sessionId");

-- AddForeignKey
ALTER TABLE "Puzzle" ADD CONSTRAINT "Puzzle_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Diagnosis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clue" ADD CONSTRAINT "Clue_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
