-- DropForeignKey
ALTER TABLE `vijesti` DROP FOREIGN KEY `vijesti_kategorija_id_fkey`;

-- DropIndex
DROP INDEX `vijesti_kategorija_id_fkey` ON `vijesti`;

-- CreateTable
CREATE TABLE `komentari` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `autor_ime` VARCHAR(191) NOT NULL,
    `sadrzaj` TEXT NOT NULL,
    `datum_kreiranja` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `vijest_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vijesti` ADD CONSTRAINT `vijesti_kategorija_id_fkey` FOREIGN KEY (`kategorija_id`) REFERENCES `kategorije`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `komentari` ADD CONSTRAINT `komentari_vijest_id_fkey` FOREIGN KEY (`vijest_id`) REFERENCES `vijesti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
