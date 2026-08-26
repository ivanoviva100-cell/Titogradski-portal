import { Uloga } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      korisnik?: {
        id: number;
        email: string;
        uloga: Uloga;
      };
      file?: Express.Multer.File;
    }
  }
}

export {};