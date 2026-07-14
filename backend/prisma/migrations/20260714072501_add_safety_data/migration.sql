-- CreateTable
CREATE TABLE "SafetyData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "lat" REAL,
    "lng" REAL,
    "cctvPurpose" TEXT,
    "cctvCount" REAL,
    "cctvPixel" REAL,
    "installYm" TEXT,
    "lampId" TEXT,
    "policeType" TEXT,
    "crimeYear" REAL,
    "crimeKill" REAL,
    "crimeRob" REAL,
    "crimeTheft" REAL,
    "crimeViolence" REAL,
    "lampType" TEXT
);

-- CreateIndex
CREATE INDEX "SafetyData_dataType_idx" ON "SafetyData"("dataType");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyData_dataType_sourceId_key" ON "SafetyData"("dataType", "sourceId");
