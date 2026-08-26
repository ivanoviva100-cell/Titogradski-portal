import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// MIDDLEWARE ZA ZAŠTITU RUTA
export const autentifikujKorisnika = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: "Pristup odbijen. Token nije proslijeđen." });
    return;
  }

  try {
    const dekodovanToken = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.korisnik = dekodovanToken;
    next();
  } catch (error) {
    res.status(403).json({ error: "Token nije validan ili je istekao." });
  }
};

// MIDDLEWARE ZA PROVJERU ADMIN ULOGE
export const zahtijevajAdmina = (req: Request, res: Response, next: NextFunction): void => {
  if (req.korisnik?.uloga !== 'ADMIN') {
    res.status(403).json({ error: "Pristup zabranjen. Samo admini mogu izvršiti ovu akciju." });
    return;
  }
  next();
};
