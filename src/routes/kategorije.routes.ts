import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/prisma.js';
import { autentifikujKorisnika } from '../middleware/auth.js';

const router = Router();

// Kreiranje kategorije
router.post('/', autentifikujKorisnika, async (req: Request, res: Response): Promise<void> => {
  try {
    const { naziv, slug } = req.body;
    if (!naziv || !slug) {
      res.status(400).json({ error: "Naziv i slug su obavezni!" });
      return;
    }
    const novaKategorija = await prisma.kategorija.create({
      data: { naziv, slug },
    });
    res.status(201).json(novaKategorija);
  } catch (error) {
    res.status(500).json({ error: "Greška prilikom kreiranja kategorije." });
  }
});

// Dohvatanje svih kategorija
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const sveKategorije = await prisma.kategorija.findMany();
    res.json(sveKategorije);
  } catch (error) {
    res.status(500).json({ error: "Greška na serveru." });
  }
});

// Dohvatanje jedne kategorije po ID-ju
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const kategorija = await prisma.kategorija.findUnique({
      where: { id: Number(id) },
    });

    if (!kategorija) {
      res.status(404).json({ error: "Kategorija nije pronađena." });
      return;
    }

    res.json(kategorija);
  } catch (error) {
    res.status(500).json({ error: "Greška prilikom dohvaćanja kategorije." });
  }
});

// Izmjena kategorije
router.put('/:id', autentifikujKorisnika, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { naziv, slug } = req.body;

    const postoji = await prisma.kategorija.findUnique({ where: { id: Number(id) } });
    if (!postoji) {
      res.status(404).json({ error: "Kategorija ne postoji." });
      return;
    }

    const azuriranaKategorija = await prisma.kategorija.update({
      where: { id: Number(id) },
      data: { 
        naziv: naziv ?? postoji.naziv,
        slug: slug ?? postoji.slug       
      },
    });

    res.json(azuriranaKategorija);
  } catch (error) {
    res.status(500).json({ error: "Greška prilikom izmjene kategorije." });
  }
});

// Brisanje kategorije
router.delete('/:id', autentifikujKorisnika, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const postoji = await prisma.kategorija.findUnique({ where: { id: Number(id) } });
    if (!postoji) {
      res.status(404).json({ error: "Kategorija ne postoji." });
      return;
    }

    await prisma.kategorija.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Kategorija uspješno obrisana!" });
  } catch (error) {
    res.status(500).json({ error: "Greška prilikom brisanja kategorije." });
  }
});

export default router;