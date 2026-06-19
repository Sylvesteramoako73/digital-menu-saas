import app from "./app";

const PORT = process.env.PORT || 4000;
const TENANT_MODE = process.env.TENANT_MODE || "path";

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} (tenant mode: ${TENANT_MODE})`);
});
