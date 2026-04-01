-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMINISTRATOR', 'CREATOR', 'VIEWER') NOT NULL DEFAULT 'VIEWER',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `verificationToken` VARCHAR(191) NULL,
    `verificationTokenExpiry` DATETIME(3) NULL,
    `resetToken` VARCHAR(191) NULL,
    `resetTokenExpiry` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `email`(`email`),
    UNIQUE INDEX `User_verificationToken_key`(`verificationToken`),
    UNIQUE INDEX `User_resetToken_key`(`resetToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Book` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `gender` VARCHAR(191) NULL,
    `topic` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `styleConfig` JSON NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chapter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `bookId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChapterSection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NULL,
    `content` JSON NOT NULL,
    `order` INTEGER NOT NULL,
    `chapterId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChapterSection_chapterId_order_idx`(`chapterId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CachedResponse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `query` TEXT NOT NULL,
    `queryHash` VARCHAR(64) NOT NULL,
    `locale` VARCHAR(191) NOT NULL DEFAULT 'en',
    `response` JSON NOT NULL,
    `searchableText` TEXT NOT NULL,
    `refusal` BOOLEAN NOT NULL DEFAULT false,
    `refusalReason` TEXT NULL,
    `hitCount` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CachedResponse_queryHash_key`(`queryHash`),
    FULLTEXT INDEX `CachedResponse_query_searchableText_idx`(`query`, `searchableText`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArchiveQuery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `bookId` INTEGER NOT NULL,
    `sectionId` INTEGER NULL,
    `cachedResponseId` INTEGER NOT NULL,
    `originalQuery` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ArchiveQuery_userId_bookId_idx`(`userId`, `bookId`),
    INDEX `ArchiveQuery_bookId_sectionId_idx`(`bookId`, `sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SectionAnalysis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectionId` INTEGER NOT NULL,
    `bookId` INTEGER NOT NULL,
    `contentHash` VARCHAR(64) NOT NULL,
    `plainText` MEDIUMTEXT NOT NULL,
    `extractedData` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `errorMessage` TEXT NULL,
    `qdrantPointId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SectionAnalysis_sectionId_key`(`sectionId`),
    INDEX `SectionAnalysis_bookId_status_idx`(`bookId`, `status`),
    INDEX `SectionAnalysis_contentHash_idx`(`contentHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Book` ADD CONSTRAINT `Book_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chapter` ADD CONSTRAINT `Chapter_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `Book`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChapterSection` ADD CONSTRAINT `ChapterSection_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `Chapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArchiveQuery` ADD CONSTRAINT `ArchiveQuery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArchiveQuery` ADD CONSTRAINT `ArchiveQuery_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `Book`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArchiveQuery` ADD CONSTRAINT `ArchiveQuery_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `ChapterSection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArchiveQuery` ADD CONSTRAINT `ArchiveQuery_cachedResponseId_fkey` FOREIGN KEY (`cachedResponseId`) REFERENCES `CachedResponse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionAnalysis` ADD CONSTRAINT `SectionAnalysis_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `ChapterSection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionAnalysis` ADD CONSTRAINT `SectionAnalysis_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `Book`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
