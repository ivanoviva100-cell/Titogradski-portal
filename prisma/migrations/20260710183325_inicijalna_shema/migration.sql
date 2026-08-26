-- CreateTable
CREATE TABLE `korisnici` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ime_prezime` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `lozinka` VARCHAR(191) NOT NULL,
    `uloga` ENUM('ADMIN', 'NOVINAR') NOT NULL DEFAULT 'NOVINAR',
    `datum_kreiranja` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `korisnici_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategorije` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `naziv` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `kategorije_naziv_key`(`naziv`),
    UNIQUE INDEX `kategorije_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vijesti` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `naslov` VARCHAR(191) NOT NULL,
    `podnaslov` TEXT NOT NULL,
    `sadrzaj` LONGTEXT NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `slika_url` VARCHAR(191) NOT NULL,
    `broj_pregleda` INTEGER NOT NULL DEFAULT 0,
    `datum_kreiranja` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `kategorija_id` INTEGER NOT NULL,
    `autor_id` INTEGER NULL,

    UNIQUE INDEX `vijesti_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vijesti` ADD CONSTRAINT `vijesti_kategorija_id_fkey` FOREIGN KEY (`kategorija_id`) REFERENCES `kategorije`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vijesti` ADD CONSTRAINT `vijesti_autor_id_fkey` FOREIGN KEY (`autor_id`) REFERENCES `korisnici`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
