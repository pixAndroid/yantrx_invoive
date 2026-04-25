-- CreateTable
CREATE TABLE "site_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "badgeText" TEXT,
    "titleLine1" TEXT,
    "titleGradientText" TEXT,
    "description" TEXT,
    "primaryBtnLabel" TEXT,
    "secondaryBtnLabel" TEXT,
    "stat1Value" TEXT,
    "stat1Label" TEXT,
    "stat2Value" TEXT,
    "stat2Label" TEXT,
    "stat3Value" TEXT,
    "stat3Label" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_configs_key_key" ON "site_configs"("key");
