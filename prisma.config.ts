import { defineConfig, env } from "@prisma/config";
import dotenv from "dotenv";
import path from "path";

// Ručno učitavamo .env fajl iz korijena projekta prije nego što Prisma krene u rad
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"), 
  },
});