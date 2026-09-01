import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { autentifikujKorisnika, zahtijevajAdmina } from '../middleware/auth.js';
const router = Router();
// ==========================================
// KORISNICI RUTE
// ==========================================
router.post('/', autentifikujKorisnika, zahtijevajAdmina, async (req, res) => {
    try {
        const { imePrezime, email, lozinka, uloga } = req.body;
        if (!imePrezime || !email || !lozinka) {
            res.status(400).json({ error: "Sva polja su obavezna." });
            return;
        }
        const postojece = await prisma.korisnik.findUnique({ where: { email } });
        if (postojece) {
            res.status(400).json({ error: "Korisnik sa ovim email-om već postoji." });
            return;
        }
        const heširanaLozinka = await bcrypt.hash(lozinka, 10);
        const noviKorisnik = await prisma.korisnik.create({
            data: {
                imePrezime,
                email,
                lozinka: heširanaLozinka,
                uloga: uloga || 'NOVINAR',
            },
            select: {
                id: true,
                imePrezime: true,
                email: true,
                uloga: true,
                datumKreiranja: true,
            },
        });
        res.status(201).json(noviKorisnik);
    }
    catch (error) {
        console.error("Greška na backendu pri kreiranju korisnika:", error);
        res.status(500).json({ error: "Greška prilikom kreiranja korisnika." });
    }
});
router.get('/', autentifikujKorisnika, async (req, res) => {
    try {
        const sviKorisnici = await prisma.korisnik.findMany({
            select: {
                id: true,
                imePrezime: true,
                email: true,
                uloga: true,
                datumKreiranja: true,
            },
            orderBy: {
                datumKreiranja: 'desc',
            },
        });
        res.json(sviKorisnici);
    }
    catch (error) {
        res.status(500).json({ error: "Greška prilikom dohvaćanja korisnika." });
    }
});
// Nova ruta za izmjenu podataka korisnika (imePrezime / uloga)
router.put('/:id', autentifikujKorisnika, zahtijevajAdmina, async (req, res) => {
    try {
        const { id } = req.params;
        const { imePrezime, uloga } = req.body;
        if (!imePrezime) {
            res.status(400).json({ error: "Ime i prezime (ili nik) je obavezno." });
            return;
        }
        const korisnikPostoji = await prisma.korisnik.findUnique({ where: { id: Number(id) } });
        if (!korisnikPostoji) {
            res.status(404).json({ error: "Korisnik ne postoji." });
            return;
        }
        const azuriraniKorisnik = await prisma.korisnik.update({
            where: { id: Number(id) },
            data: {
                imePrezime,
                ...(uloga && { uloga }),
            },
            select: {
                id: true,
                imePrezime: true,
                email: true,
                uloga: true,
                datumKreiranja: true,
            },
        });
        res.json(azuriraniKorisnik);
    }
    catch (error) {
        console.error("Greška prilikom izmjene korisnika:", error);
        res.status(500).json({ error: "Greška prilikom ažuriranja korisnika." });
    }
});
router.delete('/:id', autentifikujKorisnika, zahtijevajAdmina, async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.korisnik?.id;
        if (Number(id) === adminId) {
            res.status(400).json({ error: "Ne možete obrisati sopstveni nalog!" });
            return;
        }
        const korisnikPostoji = await prisma.korisnik.findUnique({ where: { id: Number(id) } });
        if (!korisnikPostoji) {
            res.status(404).json({ error: "Korisnik ne postoji." });
            return;
        }
        await prisma.korisnik.delete({
            where: { id: Number(id) }
        });
        res.json({ message: "Korisnik uspješno obrisan!" });
    }
    catch (error) {
        res.status(500).json({ error: "Greška prilikom brisanja korisnika." });
    }
});
export default router;
//# sourceMappingURL=korisnici.routes.js.map