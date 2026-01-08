const env = {
  port: 3000,
  jwtSecret: "dev-secret",
  tokenTtl: 60 * 60 * 24 * 7,
  corsOrigin: "*",
  uploadDir: "src/storage/uploads"
};

export default env;
