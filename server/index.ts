import "dotenv/config";
import express from "express";
import cors from "cors";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/api/ping", (req, res) => {
    res.json({ ok: true });
  });

  // Chat message endpoint
  app.post("/api/chat/message", (req, res) => {
    const { content } = req.body;
    
    let response = "Bonjour ! Je suis Baymora, votre assistant de voyage. Comment puis-je vous aider ?";
    
    if (!content) {
      return res.status(400).json({ error: "No content" });
    }

    const text = content.toLowerCase();
    
    if (text.includes("paris")) {
      response = "Paris est magnifique ! 🗼 Vous pouvez visiter la Tour Eiffel, le Louvre, Notre-Dame...";
    } else if (text.includes("new york")) {
      response = "New York ! La ville qui ne dort jamais 🗽. Central Park, Empire State Building, Times Square...";
    } else if (text.includes("tokyo")) {
      response = "Tokyo ! Une ville incroyable 🗾. Le Senso-ji, Shibuya, Akihabara...";
    } else if (text.includes("bonjour") || text.includes("hello")) {
      response = "Bonjour ! 👋 Je suis Baymora, votre assistant de voyage premium. Où voulez-vous aller ?";
    }

    res.json({ 
      response,
      id: Date.now()
    });
  });

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
