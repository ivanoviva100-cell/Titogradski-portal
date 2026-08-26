import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { autentifikujKorisnika } from '../middleware/auth.js';
const router = Router();
// ==========================================
// KOMENTARI RUTE
// ==========================================
router.get('/', autentifikujKorisnika, async (req, res) => {
    try {
        const sviKomentari = await prisma.komentar.findMany({
            orderBy: { datumKreiranja: 'desc' },
            include: {
                vijest: { select: { naslov: true } }
            }
        });
        res.json(sviKomentari);
    }
    catch (error) {
        res.status(500).json({ error: "Greška pri dohvaćanju komentara." });
    }
});
router.post('/', async (req, res) => {
    try {
        const { autorIme, sadrzaj, vijestId } = req.body;
        if (!autorIme || !sadrzaj || !vijestId) {
            res.status(400).json({ error: "Ime autora, sadržaj i vijestId su obavezni!" });
            return;
        }
        const vijestPostoji = await prisma.vijest.findUnique({
            where: { id: Number(vijestId) }
        });
        if (!vijestPostoji) {
            res.status(404).json({ error: "Vijest na koju se odnosi komentar ne postoji." });
            return;
        }
        const noviKomentar = await prisma.komentar.create({
            data: {
                autorIme,
                sadrzaj,
                vijestId: Number(vijestId)
            }
        });
        res.status(201).json(noviKomentar);
    }
    catch (error) {
        res.status(500).json({ error: "Greška prilikom kreiranja komentara." });
    }
});
router.get('/vijest/:vijestId', async (req, res) => {
    try {
        const { vijestId } = req.params;
        const komentari = await prisma.komentar.findMany({
            where: { vijestId: Number(vijestId) },
            orderBy: { datumKreiranja: 'desc' }
        });
        res.json(komentari);
    }
    catch (error) {
        res.status(500).json({ error: "Greška prilikom dohvaćanja komentara." });
    }
});
router.patch('/:id/odobri', autentifikujKorisnika, async (req, res) => {
    try {
        const { id } = req.params;
        const postoji = await prisma.komentar.findUnique({ where: { id: Number(id) } });
        if (!postoji) {
            res.status(404).json({ error: "Komentar ne postoji." });
            return;
        }
        const azuriranKomentar = await prisma.komentar.update({
            where: { id: Number(id) },
            data: { odobren: true }
        });
        res.json(azuriranKomentar);
    }
    catch (error) {
        res.status(500).json({ error: "Greška prilikom odobravanja komentara." });
    }
});
router.delete('/:id', autentifikujKorisnika, async (req, res) => {
    try {
        const { id } = req.params;
        const komentar = await prisma.komentar.findUnique({
            where: { id: Number(id) }
        });
        if (!komentar) {
            res.status(404).json({ error: "Komentar nije pronađen." });
            return;
        }
        if (req.korisnik?.uloga !== 'ADMIN') {
            res.status(403).json({ error: "Nemate dozvolu za brisanje ovog komentara." });
            return;
        }
        await prisma.komentar.delete({
            where: { id: Number(id) }
        });
        res.json({ message: "Komentar je uspješno obrisan." });
    }
    catch (error) {
        console.error("Greška pri brisanju komentara:", error);
        res.status(500).json({ error: "Greška prilikom brisanja komentara." });
    }
});
export default router;
//# sourceMappingURL=komentari.routes.js.map