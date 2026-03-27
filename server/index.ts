import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

// Simple ID generator
const genId = () => Math.random().toString(36).substr(2, 9);

// Simple in-memory stores (replace with DB later)
const conversations = new Map<string, any>();
const clientMemory = new Map<string, any>();

export function createServer() {
  const app = express();

  // =====================================================================
  // MIDDLEWARE
  // =====================================================================
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // =====================================================================
  // HEALTH CHECK
  // =====================================================================
  app.get("/api/ping", (req, res) => {
    res.json({ message: "pong", timestamp: new Date().toISOString() });
  });

  app.get("/api/demo", handleDemo);

  // =====================================================================
  // CHAT API - Simple and clean
  // =====================================================================

  /**
   * POST /api/chat/start
   * Start a new conversation
   */
  app.post("/api/chat/start", (req, res) => {
    try {
      const { language = "fr" } = req.body;
      const conversationId = genId();

      const conversation = {
        id: conversationId,
        language,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      conversations.set(conversationId, conversation);
      console.log(`[CHAT] Started conversation ${conversationId}`);

      res.status(201).json({
        conversationId,
        language,
        createdAt: conversation.createdAt,
      });
    } catch (error) {
      console.error("Error in /api/chat/start:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  /**
   * POST /api/chat/message
   * Send a message and get a response
   */
  app.post("/api/chat/message", (req, res) => {
    console.log("🔵 /api/chat/message called with:", req.body);

    try {
      const { conversationId, content } = req.body;

      if (!content) {
        console.log("❌ No content");
        res.status(400).json({ error: "Missing content" });
        return;
      }

      let convId = conversationId || "demo";
      console.log("✅ convId:", convId);

      // Create conversation if doesn't exist
      if (!conversations.has(convId)) {
        console.log("📝 Creating new conversation:", convId);
        conversations.set(convId, {
          id: convId,
          language: "fr",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const conversation = conversations.get(convId);
      console.log("✅ Got conversation:", conversation?.id);

      // Add user message
      const userMessage = {
        id: genId(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      conversation.messages.push(userMessage);

      // Generate simple response based on keywords
      let response = "";
      const lower = content.toLowerCase();

      if (lower.includes("paris")) {
        response = `Paris ! Magnifique choix ! 🗼

Voici mes recommandations :

🏨 Hébergement : 5ème arrondissement (Quartier Latin)
   Budget : 150-300€/nuit

🍽️ Restaurants :
   - Frenchie To Go (cuisine française, 2-3 étoiles)
   - Le Comptoir Général (ambiance parisienne)
   - Café de Flore (classique)

🚶 Activités :
   - Notre-Dame
   - Musée du Louvre
   - Promenade le long de la Seine
   - Montmartre

🚗 Transport : Métro parisien (carnet de 10 = 16,90€)

Combien de jours ? Avec qui ? Budget global ?`;
      } else if (lower.includes("bonjour") || lower.includes("salut")) {
        response = `Bonjour ! 👋

Bienvenue chez Baymora, votre assistant de voyage premium.

Pour vous proposer le voyage parfait, dites-moi :

📍 Où voulez-vous aller ? (destination, région, pays)
📅 Quand ? (dates ou saison)
👥 Avec qui ? (seul, couple, famille, amis ?)
💰 Quel budget ? (par personne ou total)

Je vais composer un itinéraire sur mesure ! ✨`;
      } else if (lower.includes("merci")) {
        response = `De rien ! 😊 C'est un plaisir de vous aider.

Avez-vous d'autres questions sur ce voyage ? Je peux vous aider sur :
- Les transports
- L'hébergement
- Les restaurants
- Les activités
- Le budget

Dites-moi ! 🚀`;
      } else {
        response = `Intéressant ! 🌍

Pour mieux vous aider, pouvez-vous me donner plus de détails :

1️⃣ La destination précise ?
2️⃣ Les dates de voyage ?
3️⃣ Le nombre de personnes ?
4️⃣ Votre budget approximatif ?

Avec ces infos, je vais créer un plan parfait pour vous ! ✨`;
      }

      // Add assistant response
      const assistantMessage = {
        id: genId(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      conversation.messages.push(assistantMessage);
      conversation.updatedAt = new Date();

      console.log(`[CHAT] Message in ${convId}: ${content.substring(0, 50)}...`);

      const responseData = {
        messageId: assistantMessage.id,
        response,
        timestamp: assistantMessage.timestamp,
      };

      console.log("✅ Sending response:", responseData.response.substring(0, 50));
      res.json(responseData);
    } catch (error) {
      console.error("❌ Error in /api/chat/message:", error);
      res.status(500).json({ error: "Server error", details: String(error) });
    }
  });

  /**
   * GET /api/chat/conversations/:id
   * Get a conversation
   */
  app.get("/api/chat/conversations/:id", (req, res) => {
    try {
      const { id } = req.params;
      const conversation = conversations.get(id);

      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error in /api/chat/conversations/:id:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  /**
   * DELETE /api/chat/conversations/:id
   * Delete a conversation
   */
  app.delete("/api/chat/conversations/:id", (req, res) => {
    try {
      const { id } = req.params;
      conversations.delete(id);
      console.log(`[CHAT] Deleted conversation ${id}`);
      res.json({ message: "Deleted" });
    } catch (error) {
      console.error("Error in DELETE /api/chat/conversations/:id:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  /**
   * GET /api/chat/conversations
   * List conversations
   */
  app.get("/api/chat/conversations", (req, res) => {
    try {
      const convList = Array.from(conversations.values()).map((conv) => ({
        id: conv.id,
        language: conv.language,
        messageCount: conv.messages.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));
      res.json({ conversations: convList, total: convList.length });
    } catch (error) {
      console.error("Error in /api/chat/conversations:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // =====================================================================
  // ERROR HANDLING
  // =====================================================================
  app.use((req, res) => {
    res.status(404).json({ error: "Not found", code: "ROUTE_NOT_FOUND" });
  });

  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error("Unhandled error:", err);
      res.status(500).json({
        error: "Internal server error",
        ...(process.env.NODE_ENV === "development" && { details: err.message }),
      });
    }
  );

  return app;
}
