import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { autentifikujKorisnika } from '../middleware/auth.js';
const router = Router();
async function obradiKaskadnoHeroPozicije(tx, ciljnaPozicija, trenutniId) {
    if (ciljnaPozicija === 'GLAVNA') {
        const staraGlavna = await tx.vijest.findFirst({
            where: { pozicijaHero: 'GLAVNA', ...(trenutniId ? { NOT: { id: trenutniId } } : {}) }
        });
        if (staraGlavna) {
            await tx.vijest.update({
                where: { id: staraGlavna.id },
                data: { pozicijaHero: 'SPOREDNA' }
            });
        }
        await provjeriIspraviBrojSporednih(tx, trenutniId);
    }
    else if (ciljnaPozicija === 'SPOREDNA') {
        await provjeriIspraviBrojSporednih(tx, trenutniId);
    }
}
async function provjeriIspraviBrojSporednih(tx, trenutniId) {
    const sporedneVijesti = await tx.vijest.findMany({
        where: {
            pozicijaHero: 'SPOREDNA',
            ...(trenutniId ? { NOT: { id: trenutniId } } : {})
        },
        orderBy: { datumKreiranja: 'asc' }
    });
    if (sporedneVijesti.length >= 4) {
        const najstarijaSporedna = sporedneVijesti[0];
        await tx.vijest.update({
            where: { id: najstarijaSporedna.id },
            data: { pozicijaHero: 'STANDARDNA' }
        });
    }
}
// ==========================================
// VIJESTI RUTE
// ==========================================
router.post('/', autentifikujKorisnika, async (req, res) => {
    try {
        const { naslov, podnaslov, sadrzaj, slug, slikaUrl, slikaOpis, kategorijaId, autorId, pozicijaHero, fotoGalerija } = req.body;
        if (!naslov || !podnaslov || !sadrzaj || !slug || !slikaUrl || !kategorijaId) {
            res.status(400).json({ error: "Naslov, podnaslov, sadržaj, slug, slikaUrl i kategorijaId su obavezni!" });
            return;
        }
        const kategorijaPostoji = await prisma.kategorija.findUnique({
            where: { id: Number(kategorijaId) }
        });
        if (!kategorijaPostoji) {
            res.status(400).json({ error: "Zadata kategorija ne postoji u bazi!" });
            return;
        }
        const zeljenaPozicija = pozicijaHero || 'STANDARDNA';
        const novaVijest = await prisma.$transaction(async (tx) => {
            await obradiKaskadnoHeroPozicije(tx, zeljenaPozicija);
            return await tx.vijest.create({
                data: {
                    naslov,
                    podnaslov,
                    sadrzaj,
                    slug,
                    slikaUrl,
                    slikaOpis: slikaOpis ? String(slikaOpis) : null,
                    fotoGalerija: Array.isArray(fotoGalerija) ? fotoGalerija : [],
                    pozicijaHero: zeljenaPozicija,
                    kategorijaId: Number(kategorijaId),
                    autorId: autorId ? Number(autorId) : req.korisnik?.id || null
                }
            });
        });
        res.status(201).json(novaVijest);
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(400).json({ error: "Vijest sa ovim slug-om već postoji!" });
            return;
        }
        console.error("Greška pri kreiranju vijesti:", error);
        res.status(500).json({ error: "Greška prilikom kreiranja vijesti." });
    }
});
router.get('/', async (req, res) => {
    try {
        const { kategorija, limit, page } = req.query;
        const where = kategorija
            ? {
                kategorija: {
                    naziv: {
                        equals: String(kategorija),
                        mode: 'insensitive',
                    },
                },
            }
            : {};
        const queryOptions = {
            where,
            include: {
                kategorija: true,
                autor: {
                    select: { id: true, imePrezime: true, email: true },
                },
                _count: {
                    select: { komentari: true },
                },
            },
            orderBy: {
                datumKreiranja: 'desc',
            },
        };
        if (limit) {
            queryOptions.take = Number(limit);
        }
        if (page && limit) {
            queryOptions.skip = (Number(page) - 1) * Number(limit);
        }
        const [sveVijesti, ukupno] = await Promise.all([
            prisma.vijest.findMany(queryOptions),
            prisma.vijest.count({ where }),
        ]);
        if (kategorija || limit || page) {
            res.json({
                vijesti: sveVijesti,
                ukupno,
                stranica: Number(page) || 1,
            });
            return;
        }
        res.json(sveVijesti);
    }
    catch (error) {
        console.error("Greška pri dohvaćanju vijesti:", error);
        res.status(500).json({ error: "Greška na serveru prilikom dohvaćanja vijesti." });
    }
});
router.get('/najnovije', autentifikujKorisnika, async (req, res) => {
    try {
        const najnovijeVijesti = await prisma.vijest.findMany({
            take: 5,
            orderBy: { datumKreiranja: 'desc' },
            include: {
                kategorija: { select: { naziv: true } },
                autor: { select: { imePrezime: true } },
            },
        });
        res.json(najnovijeVijesti);
    }
    catch (error) {
        res.status(500).json({ error: "Greška prilikom dohvaćanja najnovijih vijesti." });
    }
});
router.get('/kategorija/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const kategorija = await prisma.kategorija.findUnique({
            where: { slug: String(slug) },
        });
        if (!kategorija) {
            res.status(404).json({ error: "Kategorija nije pronađena." });
            return;
        }
        const vijesti = await prisma.vijest.findMany({
            where: { kategorijaId: kategorija.id },
            include: {
                kategorija: true,
                autor: {
                    select: { id: true, imePrezime: true, email: true }
                }
            },
            orderBy: { datumKreiranja: 'desc' },
        });
        res.json(vijesti);
    }
    catch (error) {
        console.error("Greška pri dohvatanju vijesti po kategoriji:", error);
        res.status(500).json({ error: "Greška na serveru." });
    }
});
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const vijest = await prisma.vijest.update({
            where: { slug: String(slug) },
            data: { brojPregleda: { increment: 1 } },
            include: {
                kategorija: true,
                autor: { select: { id: true, imePrezime: true, email: true } },
                komentari: { orderBy: { datumKreiranja: 'desc' } }
            }
        });
        res.json(vijest);
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ error: "Vijest nije pronađena." });
            return;
        }
        res.status(500).json({ error: "Greška prilikom dohvaćanja vijesti." });
    }
});
router.put('/:id', autentifikujKorisnika, async (req, res) => {
    try {
        const { id } = req.params;
        const vijestId = Number(id);
        const { naslov, podnaslov, sadrzaj, slug, slikaUrl, slikaOpis, kategorijaId, pozicijaHero, fotoGalerija } = req.body;
        const postoji = await prisma.vijest.findUnique({ where: { id: vijestId } });
        if (!postoji) {
            res.status(404).json({ error: "Vijest ne postoji." });
            return;
        }
        if (kategorijaId) {
            const katPostoji = await prisma.kategorija.findUnique({ where: { id: Number(kategorijaId) } });
            if (!katPostoji) {
                res.status(400).json({ error: "Zadata nova kategorija ne postoji u bazi!" });
                return;
            }
        }
        const novaPozicija = pozicijaHero !== undefined ? pozicijaHero : postoji.pozicijaHero;
        const azuriranaVijest = await prisma.$transaction(async (tx) => {
            if (novaPozicija !== postoji.pozicijaHero || novaPozicija === 'GLAVNA' || novaPozicija === 'SPOREDNA') {
                await obradiKaskadnoHeroPozicije(tx, novaPozicija, vijestId);
            }
            return await tx.vijest.update({
                where: { id: vijestId },
                data: {
                    naslov: naslov ?? postoji.naslov,
                    podnaslov: podnaslov ?? postoji.podnaslov,
                    sadrzaj: sadrzaj ?? postoji.sadrzaj,
                    slug: slug ?? postoji.slug,
                    slikaUrl: slikaUrl ?? postoji.slikaUrl,
                    slikaOpis: slikaOpis !== undefined ? (slikaOpis ? String(slikaOpis) : null) : postoji.slikaOpis,
                    fotoGalerija: fotoGalerija !== undefined ? fotoGalerija : postoji.fotoGalerija,
                    pozicijaHero: novaPozicija,
                    kategorijaId: kategorijaId ? Number(kategorijaId) : postoji.kategorijaId
                }
            });
        });
        res.json(azuriranaVijest);
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(400).json({ error: "Zauzet je ovaj novi slug!" });
            return;
        }
        console.error("Greška prilikom izmjene vijesti:", error);
        res.status(500).json({ error: "Greška prilikom izmjene vijesti." });
    }
});
router.delete('/:id', autentifikujKorisnika, async (req, res) => {
    const vijestId = parseInt(req.params.id);
    if (!req.korisnik) {
        res.status(401).json({ error: 'Neautorizovan pristup.' });
        return;
    }
    const { id: korisnikId, uloga } = req.korisnik;
    try {
        if (uloga === 'ADMIN') {
            await prisma.vijest.delete({ where: { id: vijestId } });
            res.json({ message: 'Vijest je uspješno obrisana.' });
            return;
        }
        if (uloga === 'NOVINAR') {
            const postojeciZahtjev = await prisma.zahtjevZaBrisanje.findFirst({
                where: { vijestId, status: 'NA_CEKANJU' }
            });
            if (postojeciZahtjev) {
                res.status(400).json({ error: 'Zahtjev za brisanje ove vijesti je već poslat administratoru.' });
                return;
            }
            const razlogBrisanja = (req.body && req.body.razlog) ? req.body.razlog : 'Novinar je zatražio brisanje.';
            await prisma.zahtjevZaBrisanje.create({
                data: {
                    vijestId,
                    podnosilacId: korisnikId,
                    razlog: razlogBrisanja
                }
            });
            res.json({ message: 'Zahtjev za brisanje je uspješno poslat administratoru.' });
            return;
        }
        res.status(403).json({ error: 'Nemate dozvolu za ovu akciju.' });
    }
    catch (error) {
        console.error("DETALJNA GRESKA PRI BRISANJU:", error);
        res.status(500).json({ error: 'Greška pri obradi zahtjeva za brisanje.' });
    }
});
export default router;
//# sourceMappingURL=vijesti.routes.js.map