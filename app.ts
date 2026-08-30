import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

import kategorijeRute from './src/routes/kategorije.routes.js';
import komentariRute from './src/routes/komentari.routes.js';
import korisniciRute from './src/routes/korisnici.routes.js';
import podesavanjaRute from './src/routes/podesavanja.routes.js';
import reklameRute from './src/routes/reklame.routes.js';
import staticneStraniceRute from './src/routes/staticneStranice.routes.js';
import statistikaRute from './src/routes/statistika.routes.js';
import vijestiRute from './src/routes/vijesti.routes.js';
import zahtjeviZaBrisanjeRute from './src/routes/zahtjeviZaBrisanje.routes.js';
import authRute from './src/routes/auth.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ storage: multer.memoryStorage() });

app.use('/kategorije', kategorijeRute);
app.use('/komentari', komentariRute);
app.use('/korisnici', korisniciRute);
app.use('/podesavanja', podesavanjaRute);
app.use('/reklame', reklameRute);
app.use('/staticne-stranice', staticneStraniceRute);
app.use('/statistika', statistikaRute);
app.use('/vijesti', vijestiRute);
app.use('/zahtjevi-za-brisanje', zahtjeviZaBrisanjeRute);
app.use('/auth', authRute);

// Ruta za upload, optimizaciju i provjeru duplikata slike
app.post('/api/upload', upload.single('slika'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nema priložene slike.' });
    }

    const fileHash = crypto
      .createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');

    const existingFiles = fs.readdirSync(uploadDir);
    const duplicateFile = existingFiles.find((file) => file.startsWith(`img-${fileHash}`));

    if (duplicateFile) {
      const slikaUrl = `/uploads/${duplicateFile}`;
      return res.json({ slikaUrl, duplicate: true });
    }

    const fileName = `img-${fileHash}.webp`;
    const outputPath = path.join(uploadDir, fileName);

    await sharp(req.file.buffer)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 80 }) 
      .toFile(outputPath);

    const slikaUrl = `/uploads/${fileName}`;
    
    res.json({ slikaUrl, duplicate: false });
  } catch (error) {
    console.error('Greška pri obradi slike:', error);
    res.status(500).json({ error: 'Greška prilikom optimizacije slike.' });
  }
});

// ==========================================
// POKRETANJE SERVERA 
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server radi na http://localhost:${PORT}`);
});
