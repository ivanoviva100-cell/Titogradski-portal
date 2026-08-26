import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/prisma.js';
import { autentifikujKorisnika, zahtijevajAdmina } from '../middleware/auth.js';

const router = Router();

// ==========================================
// PODEŠAVANJA RUTE
// ==========================================

router.get('/', async (req: Request, res: Response) => {
  try {
    let podesavanja = await prisma.podesavanja.findFirst();

    if (!podesavanja) {
      podesavanja = await prisma.podesavanja.create({
        data: {
          nazivPortala: "Titogradski Novinarski Portal",
          opisPortala: "Najnovije vijesti iz Podgorice i okoline.",
        },
      });
    }

    res.json(podesavanja);
  } catch (error) {
    res.status(500).json({ error: "Greška prilikom dohvaćanja podešavanja." });
  }
});

router.put('/', autentifikujKorisnika, zahtijevajAdmina, async (req: Request, res: Response) => {
  try {
    const { nazivPortala, opisPortala } = req.body;

    let podesavanja = await prisma.podesavanja.findFirst();

    if (podesavanja) {
      podesavanja = await prisma.podesavanja.update({
        where: { id: podesavanja.id },
        data: { nazivPortala, opisPortala },
      });
    } else {
      podesavanja = await prisma.podesavanja.create({
        data: { nazivPortala, opisPortala },
      });
    }

    res.json(podesavanja);
  } catch (error) {
    res.status(500).json({ error: "Greška prilikom čuvanja podešavanja." });
  }
});

export default router