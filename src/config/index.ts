const env = {
  port: 3000,
  jwtSecret: "dev-secret",
  tokenTtl: "7d",
  corsOrigin: "*",
  uploadDir: "src/storage/uploads"
};

export default env;
