-- CreateEnum
CREATE TYPE "AiContextScope" AS ENUM ('GLOBAL', 'DEAL');

-- CreateEnum
CREATE TYPE "OtaDocumentStatus" AS ENUM ('UPLOADING', 'EXTRACTING', 'ANALYZING', 'COMPLETE', 'ERROR');

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "context" "AiContextScope" NOT NULL DEFAULT 'GLOBAL',
    "dealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtaDocument" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "status" "OtaDocumentStatus" NOT NULL DEFAULT 'UPLOADING',
    "extractedText" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtaDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtaAnalysis" (
    "id" TEXT NOT NULL,
    "otaDocumentId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "compliance" JSONB NOT NULL,
    "agreedVsOpen" JSONB NOT NULL,
    "operationalImpact" JSONB NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtaAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiConversation_userId_updatedAt_idx" ON "AiConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "AiConversation_dealId_idx" ON "AiConversation"("dealId");

-- CreateIndex
CREATE INDEX "AiMessage_conversationId_createdAt_idx" ON "AiMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "OtaDocument_dealId_idx" ON "OtaDocument"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "OtaAnalysis_otaDocumentId_key" ON "OtaAnalysis"("otaDocumentId");

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtaDocument" ADD CONSTRAINT "OtaDocument_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtaDocument" ADD CONSTRAINT "OtaDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtaAnalysis" ADD CONSTRAINT "OtaAnalysis_otaDocumentId_fkey" FOREIGN KEY ("otaDocumentId") REFERENCES "OtaDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
