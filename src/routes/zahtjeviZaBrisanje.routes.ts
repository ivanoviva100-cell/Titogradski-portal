import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/prisma.js';
import { autentifikujKorisnika, zahtijevajAdmina } from '../middleware/auth.js';

const router = Router();

// ==========================================
// RUTE ZA ZAHTJEVE ZA BRISANJE (ADMIN)
// ==========================================

router.get('/', autentifikujKorisnika, zahtijevajAdmina, async (req: Request, res: Response) => {
  try {
    const zahtjevi = await prisma.zahtjevZaBrisanje.findMany({
      where: { status: 'NA_CEKANJU' },
      include: {
        podnosilac: { select: { id: true, imePrezime: true, email: true } },
        vijest: { select: { id: true, naslov: true } }
      },
      orderBy: { datumKreiranja: 'desc' }
    });
    res.json(zahtjevi);
  } catch (error) {
    res.status(500).json({ error: 'Greška pri preuzimanju zahtjeva za brisanje.' });
  }
});

router.post('/:id/odluka', autentifikujKorisnika, zahtijevajAdmina, async (req: Request, res: Response) => {
  const zahtjevId = parseInt(req.params.id as string);
  const { prihvaceno } = req.body;

  try {
    const zahtjev = await prisma.zahtjevZaBrisanje.findUnique({ where: { id: zahtjevId } });
    if (!zahtjev) {
      res.status(404).json({ error: 'Zahtjev nije pronađen.' });
      return;
    }

    if (prihvaceno) {
      await prisma.vijest.delete({ where: { id: zahtjev.vijestId } });
      res.json({ message: 'Zahtjev prihvaćen. Vijest je trajno obrisana.' });
      return;
    } else {
      await prisma.zahtjevZaBrisanje.update({
        where: { id: zahtjevId },
        data: { status: 'ODBIJENO' }
      });
      res.json({ message: 'Zahtjev za brisanje je odbijen.' });
      return;
    }
  } catch (error) {
    res.status(500).json({ error: 'Greška pri obradi odluke o brisanju.' });
  }
});

export default router