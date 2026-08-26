import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/prisma.js';
import { autentifikujKorisnika } from '../middleware/auth.js';

const router = Router();

// ==========================================
// STATISTIKA 
// ==========================================

router.get('/', autentifikujKorisnika, async (req: Request, res: Response) => {
  try {
    const [ukupnoVijesti, ukupnoKategorija, ukupnoKomentara, ukupnoKorisnika] = await Promise.all([
      prisma.vijest.count(),
      prisma.kategorija.count(),
      prisma.komentar.count(),
      prisma.korisnik.count(),
    ]);

    res.json({
      ukupnoVijesti,
      ukupnoKategorija,
      ukupnoKomentara,
      ukupnoKorisnika,
    });
  } catch (error) {
    console.error("Greška pri dohvatu statistike:", error);
    res.status(500).json({ error: "Greška prilikom dohvaćanja statistike." });
  }
});

export default router