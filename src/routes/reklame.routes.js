import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { autentifikujKorisnika, zahtijevajAdmina } from '../middleware/auth.js';
const router = Router();
// ==========================================
// REKLAME RUTE
// ==========================================
// Dohvatanje svih reklama (sa mogućnošću filtriranja po poziciji ili aktivnost na javnom sajtu)
router.get('/', async (req, res) => {
    try {
        const { pozicija, aktivna } = req.query;
        const where = {};
        if (pozicija) {
            where.pozicija = String(pozicija);
        }
        if (aktivna !== undefined) {
            where.aktivna = aktivna === 'true';
        }
        const reklame = await prisma.reklama.findMany({
            where,
            orderBy: { id: 'desc' },
        });
        res.json(reklame);
    }
    catch (error) {
        console.error("Greška pri dohvaćanju reklama:", error);
        res.status(500).json({ error: "Greška prilikom dohvaćanja reklama." });
    }
});
// Dohvatanje pojedinačne reklame po ID-ju
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const reklama = await prisma.reklama.findUnique({
            where: { id: Number(id) },
        });
        if (!reklama) {
            res.status(404).json({ error: "Reklama nije pronađena." });
            return;
        }
        res.json(reklama);
    }
    catch (error) {
        res.status(500).json({ error: "Greška prilikom dohvaćanja reklame." });
    }
});
// Kreiranje nove reklame (Samo Admin)
router.post('/', autentifikujKorisnika, zahtijevajAdmina, async (req, res) => {
    try {
        const { naziv, pozicija, slikaUrl, linkUrl, aktivna } = req.body;
        if (!naziv || !pozicija || !slikaUrl) {
            res.status(400).json({ error: "Naziv, pozicija i slikaUrl su obavezni!" });
            return;
        }
        const novaReklama = await prisma.reklama.create({
            data: {
                naziv,
                pozicija,
                slikaUrl,
                linkUrl: linkUrl || null,
                aktivna: aktivna !== undefined ? Boolean(aktivna) : true,
            },
        });
        res.status(201).json(novaReklama);
    }
    catch (error) {
        console.error("Greška pri kreiranju reklame:", error);
        res.status(500).json({ error: "Greška prilikom kreiranja reklame." });
    }
});
// Izmjena postojeće reklame (Samo Admin)
router.put('/:id', autentifikujKorisnika, zahtijevajAdmina, async (req, res) => {
    try {
        const { id } = req.params;
        const { naziv, pozicija, slikaUrl, linkUrl, aktivna } = req.body;
        const postoji = await prisma.reklama.findUnique({ where: { id: Number(id) } });
        if (!postoji) {
            res.status(404).json({ error: "Reklama ne postoji." });
            return;
        }
        const azuriranaReklama = await prisma.reklama.update({
            where: { id: Number(id) },
            data: {
                naziv: naziv ?? postoji.naziv,
                pozicija: pozicija ?? postoji.pozicija,
                slikaUrl: slikaUrl ?? postoji.slikaUrl,
                linkUrl: linkUrl !== undefined ? linkUrl : postoji.linkUrl,
                aktivna: aktivna !== undefined ? Boolean(aktivna) : postoji.aktivna,
            },
        });
        res.json(azuriranaReklama);
    }
    catch (error) {
        console.error("Greška pri izmjeni reklame:", error);
        res.status(500).json({ error: "Greška prilikom izmjene reklame." });
    }
});
// Brisanje reklame (Samo Admin)
router.delete('/:id', autentifikujKorisnika, zahtijevajAdmina, async (req, res) => {
    try {
        const { id } = req.params;
        const postoji = await prisma.reklama.findUnique({ where: { id: Number(id) } });
        if (!postoji) {
            res.status(404).json({ error: "Reklama ne postoji." });
            return;
        }
        await prisma.reklama.delete({
            where: { id: Number(id) },
        });
        res.json({ message: "Reklama je uspješno obrisana." });
    }
    catch (error) {
        console.error("Greška pri brisanju reklame:", error);
        res.status(500).json({ error: "Greška prilikom brisanja reklame." });
    }
});
export default router;
//# sourceMappingURL=reklame.routes.js.map