import { createAgentTask, getQueuedTasks, updateAgentTask } from "../db";
import { generateSeoCard } from "./seoGenerator";
import { invokeLLM } from "../_core/llm";

// ─── In-Process Event Bus for Agent Coordination ─────────────────────
// This is the MVP implementation. In production, replace with Redis Pub/Sub or RabbitMQ.

type AgentHandler = (taskId: number, input: any) => Promise<string>;

const agentHandlers: Record<string, AgentHandler> = {};

export function registerAgent(agentType: string, handler: AgentHandler) {
  agentHandlers[agentType] = handler;
}

export async function dispatchTask(
  department: "acquisition" | "concierge" | "logistics" | "quality",
  agentType: string,
  taskType: string,
  input: any,
  priority = 5
): Promise<number> {
  const taskId = await createAgentTask(department, agentType, taskType, JSON.stringify(input), priority);
  // Process asynchronously
  processTask(taskId, agentType, input).catch(console.error);
  return taskId;
}

async function processTask(taskId: number, agentType: string, input: any) {
  const handler = agentHandlers[agentType];
  if (!handler) {
    await updateAgentTask(taskId, { status: "failed", errorMessage: `No handler registered for agent type: ${agentType}` });
    return;
  }

  await updateAgentTask(taskId, { status: "processing" });

  try {
    const output = await handler(taskId, input);
    await updateAgentTask(taskId, { status: "completed", output });
  } catch (error: any) {
    await updateAgentTask(taskId, { status: "failed", errorMessage: error.message || "Unknown error" });
  }
}

// ─── Register Built-in Agents ────────────────────────────────────────

// Département Acquisition : Agent Rédacteur SEO
registerAgent("seo_writer", async (_taskId, input) => {
  const cardId = await generateSeoCard(input);
  return JSON.stringify({ cardId, status: "card_created" });
});

// Département Acquisition : Agent Trend Spotter
registerAgent("trend_spotter", async (_taskId, input) => {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Tu es un expert en tendances du tourisme de luxe. Identifie les destinations, restaurants et expériences émergentes. Réponds en JSON avec un tableau de suggestions."
      },
      {
        role: "user",
        content: `Identifie 5 tendances émergentes pour le tourisme de luxe dans la région: ${input.region || "monde entier"}. Saison: ${input.season || "toute l'année"}.`
      },
    ],
  });
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : JSON.stringify(content);
});

// Département Acquisition : Agent Social Media
registerAgent("social_media", async (_taskId, input) => {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Tu es un expert en création de contenu ${input.platform} pour le secteur du luxe et du voyage. Crée du contenu engageant et esthétique.`
      },
      {
        role: "user",
        content: `Crée un ${input.contentType} pour ${input.platform} à partir de cette fiche: ${input.cardTitle}. Description: ${input.cardDescription?.substring(0, 500)}`
      },
    ],
  });
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : JSON.stringify(content);
});

// Département Qualité : Agent Fact Checker
registerAgent("fact_checker", async (_taskId, input) => {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Tu es un vérificateur de faits spécialisé dans le tourisme. Vérifie que les informations sont plausibles et cohérentes. Signale tout ce qui semble inventé, obsolète ou incohérent. Réponds en JSON: { \"issues\": [...], \"isValid\": boolean, \"confidence\": number }"
      },
      {
        role: "user",
        content: `Vérifie cette fiche: ${JSON.stringify(input.cardData)}`
      },
    ],
  });
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : JSON.stringify(content);
});

// Département Concierge : Agent Profiler
registerAgent("profiler", async (_taskId, input) => {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Tu es un expert en analyse comportementale spécialisé dans la clientèle de luxe. Analyse les messages pour extraire le profil psychologique du client (budget implicite, style de voyage, niveau d'exigence, personnalité). Réponds en JSON."
      },
      {
        role: "user",
        content: `Analyse ces messages du client et déduis son profil: ${JSON.stringify(input.messages?.slice(-10))}`
      },
    ],
  });
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : JSON.stringify(content);
});

// ─── Batch Processing (for cron-like scheduled tasks) ────────────────
export async function processPendingTasks(department?: string) {
  const tasks = await getQueuedTasks(department, 5);
  for (const task of tasks) {
    try {
      const input = task.input ? JSON.parse(task.input) : {};
      await processTask(task.id, task.agentType, input);
    } catch (error) {
      console.error(`[AgentBus] Failed to process task ${task.id}:`, error);
    }
  }
  return tasks.length;
}
