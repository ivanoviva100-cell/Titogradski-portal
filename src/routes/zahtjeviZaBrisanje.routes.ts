import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/prisma.js';
import { autentifikujKorisnika, zahtijevajAdmina } from '../middleware/auth.js';

const router = Router();

// 1. Kreiranje zahtjeva za brisanje (Mogu i novinari i admini)
router.post('/', autentifikujKorisnika, async (req: Request, res: Response) => {
  try {
    const { vijestId, razlog } = req.body;
    const korisnikId = (req as any).korisnik.id;

    const noviZahtjev = await prisma.zahtjevZaBrisanje.create({
      data: {
        vijestId: parseInt(vijestId),
        podnosilacId: korisnikId,
        razlog: razlog || 'Brisanje od strane novinara',
        status: 'NA_CEKANJU'
      }
    });

    return res.status(201).json({ message: 'Zahtjev za brisanje je uspješno poslat administratoru.', noviZahtjev });
  } catch (error) {
    return res.status(500).json({ error: 'Greška pri kreiranju zahtjeva za brisanje.' });
  }
});

// 2. Pregled svih zahtjeva (Samo ADMIN)
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
    return res.status(200).json(zahtjevi);
  } catch (error) {
    return res.status(500).json({ error: 'Greška pri preuzimanju zahtjeva za brisanje.' });
  }
});

// 3. Odluka administratora (Samo ADMIN)
router.post('/:id/odluka', autentifikujKorisnika, zahtijevajAdmina, async (req: Request, res: Response) => {
  const zahtjevId = parseInt(req.params.id as string);
  const { prihvaceno } = req.body;

  try {
    const zahtjev = await prisma.zahtjevZaBrisanje.findUnique({ where: { id: zahtjevId } });
    if (!zahtjev) {
      return res.status(404).json({ error: 'Zahtjev nije pronađen.' });
    }

    if (prihvaceno) {
      // Koristimo transakciju da se sve izvrši ili ništa
      await prisma.$transaction(async (tx) => {
        // Prvo obrišemo zahtjev iz baze (ili mu promijenimo status prije brisanja vijesti)
        // Najčistije je obrisati zahtjev za brisanje jer vijest više ne postoji
        await tx.zahtjevZaBrisanje.delete({
          where: { id: zahtjevId }
        });

        // Zatim obrišemo samu vijest
        await tx.vijest.delete({
          where: { id: zahtjev.vijestId }
        });
      });

      return res.status(200).json({ message: 'Zahtjev prihvaćen. Vijest je trajno obrisana.' });
    } else {
      // Ako je odbijeno, samo azuriramo status
      await prisma.zahtjevZaBrisanje.update({
        where: { id: zahtjevId },
        data: { status: 'ODBIJENO' }
      });
      return res.status(200).json({ message: 'Zahtjev za brisanje je odbijen.' });
    }
  } catch (error) {
    console.error('Greška pri brisanju:', error);
    return res.status(500).json({ error: 'Greška pri obradi odluke o brisanju.' });
  }
});

export default router;