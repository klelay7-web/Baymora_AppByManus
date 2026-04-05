/**
 * Point d'entrée Express pour le développement local
 * Tourne sur le port 3001, séparé de Vite (port 8080)
 */
import "dotenv/config";
import { createServer } from "./index";
import { startBirthdayCron } from "./services/birthdayCron";

const PORT = 3001;
const app = createServer();

app.listen(PORT, () => {
  console.log(`[Baymora] API server → http://localhost:${PORT}`);
  startBirthdayCron();
});
