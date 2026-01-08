import dotenv from "dotenv";

dotenv.config();

const env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  tokenTtl: process.env.TOKEN_TTL ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  uploadDir: process.env.UPLOAD_DIR ?? "src/storage/uploads"
};

export default env;
