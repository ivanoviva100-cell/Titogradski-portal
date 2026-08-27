import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/prisma.js';
import { autentifikujKorisnika, zahtijevajAdmina } from '../middleware/auth.js';
import sanitizeHtml from 'sanitize-html';

const router = Router();

// ==========================================
// STATIČNE STRANICE RUTE
// ==========================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const { tip } = req.query;

    if (!tip) {
      res.status(400).json({ error: "Nedostaje parametar 'tip' stranice." });
      return;
    }

    const stranica = await prisma.stvarnaStranica.findUnique({
      where: { tip: String(tip) },
    });

    res.json({ sadrzaj: stranica ? stranica.sadrzaj : '' });
  } catch (error) {
    console.error("Greška pri dohvaćanju statične stranice:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

router.post('/', autentifikujKorisnika, zahtijevajAdmina, async (req: Request, res: Response) => {
  try {
    const { tip, sadrzaj } = req.body;

    if (!tip || sadrzaj === undefined) {
      res.status(400).json({ error: "Tip i sadržaj su obavezni!" });
      return;
    }
    
    // SANITIZACIJA UNOSA: Dozvoljavamo bezbjedne HTML tagove, a uklanjamo <script>, onerror i slične prijetnje
    const ocisceniSadrzaj = sanitizeHtml(sadrzaj, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['class', 'style'],
        'a': ['href', 'name', 'target'],
        'img': ['src', 'alt', 'title', 'width', 'height']
      }
    });

    const sacuvanaStranica = await prisma.stvarnaStranica.upsert({
      where: { tip: String(tip) },
      update: { sadrzaj: ocisceniSadrzaj },
      create: { tip: String(tip), sadrzaj },
    });

    res.json({ success: true, message: "Uspješno sačuvano", stranica: sacuvanaStranica });
  } catch (error) {
    console.error("Greška pri čuvanju statične stranice:", error);
    res.status(500).json({ error: "Greška prilikom čuvanja." });
  }
});

export default router