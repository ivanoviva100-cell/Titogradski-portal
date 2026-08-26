import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
const router = Router();
// ==========================================
// AUTENTIFIKACIJA RUTE
// ==========================================
router.post('/registracija', async (req, res) => {
    try {
        const { imePrezime, email, lozinka, uloga } = req.body;
        if (!imePrezime || !email || !lozinka) {
            res.status(400).json({ error: "Ime i prezime, email i lozinka su obavezni!" });
            return;
        }
        const korisnikPostoji = await prisma.korisnik.findUnique({ where: { email } });
        if (korisnikPostoji) {
            res.status(400).json({ error: "Korisnik sa ovim emailom već postoji!" });
            return;
        }
        const hashedPassword = await bcrypt.hash(lozinka, 10);
        const noviKorisnik = await prisma.korisnik.create({
            data: {
                imePrezime,
                email,
                lozinka: hashedPassword,
                uloga: uloga || 'NOVINAR'
            }
        });
        res.status(201).json({
            id: noviKorisnik.id,
            imePrezime: noviKorisnik.imePrezime,
            email: noviKorisnik.email,
            uloga: noviKorisnik.uloga
        });
    }
    catch (error) {
        res.status(500).json({ error: "Greška prilikom registracije." });
    }
});
router.post('/prijava', async (req, res) => {
    try {
        const { email, lozinka } = req.body;
        if (!email || !lozinka) {
            res.status(400).json({ error: "Email i lozinka su obavezni!" });
            return;
        }
        const korisnik = await prisma.korisnik.findUnique({ where: { email } });
        if (!korisnik) {
            res.status(401).json({ error: "Pogrešan email ili lozinka!" });
            return;
        }
        const lozinkaTacna = await bcrypt.compare(lozinka, korisnik.lozinka);
        if (!lozinkaTacna) {
            res.status(401).json({ error: "Pogrešan email ili lozinka!" });
            return;
        }
        const token = jwt.sign({ id: korisnik.id, email: korisnik.email, uloga: korisnik.uloga }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
            poruka: "Uspješna prijava!",
            token,
            korisnik: {
                id: korisnik.id,
                imePrezime: korisnik.imePrezime,
                uloga: korisnik.uloga
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: "Greška prilikom prijave." });
    }
});
export default router;
//# sourceMappingURL=auth.routes.js.map