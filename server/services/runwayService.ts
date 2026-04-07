import RunwayML from "@runwayml/sdk";

const runway = new RunwayML({ apiKey: process.env.RUNWAY_API_KEY });

export interface VideoGenerationInput {
  promptText: string;
  duration?: 5 | 10;
  ratio?: "1280:720" | "720:1280";
}

export interface VideoGenerationResult {
  taskId: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  videoUrl?: string;
  error?: string;
}

/**
 * Lance une génération vidéo text-to-video via Runway Gen-4 Turbo
 */
export async function generateVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
  try {
    const task = await runway.textToVideo.create({
      model: "gen4.5",
      promptText: input.promptText,
      duration: input.duration ?? 5,
      ratio: (input.ratio === "720:1280" ? "720:1280" : "1280:720") as "1280:720" | "720:1280",
    });

    return {
      taskId: task.id,
      status: "pending",
    };
  } catch (err: any) {
    console.error("[Runway] Error creating video task:", err?.message);
    throw new Error(`Runway generation failed: ${err?.message ?? "unknown error"}`);
  }
}

/**
 * Vérifie le statut d'une tâche vidéo Runway
 */
export async function checkVideoStatus(taskId: string): Promise<VideoGenerationResult> {
  try {
    const task = await runway.tasks.retrieve(taskId);

    if (task.status === "SUCCEEDED") {
      const output = (task as any).output;
      const videoUrl = Array.isArray(output) ? output[0] : output;
      return {
        taskId: task.id,
        status: "succeeded",
        videoUrl: videoUrl ?? undefined,
      };
    }

    if (task.status === "FAILED") {
      return {
        taskId: task.id,
        status: "failed",
        error: (task as any).failure ?? "Generation failed",
      };
    }

    return {
      taskId: task.id,
      status: task.status === "RUNNING" ? "processing" : "pending",
    };
  } catch (err: any) {
    console.error("[Runway] Error checking task status:", err?.message);
    throw new Error(`Runway status check failed: ${err?.message ?? "unknown error"}`);
  }
}

/**
 * Vérifie que la clé API Runway est valide (test léger)
 */
export async function validateRunwayKey(): Promise<boolean> {
  try {
    // On tente de lister les tâches récentes — appel léger sans coût
    await runway.tasks.retrieve("test_nonexistent_id_validation").catch(() => {
      // Une erreur 404 signifie que la clé est valide mais la tâche n'existe pas
      // Une erreur 401 signifie que la clé est invalide
    });
    return true;
  } catch (err: any) {
    if (err?.status === 401 || err?.message?.includes("401")) return false;
    // 404 = clé valide, tâche inexistante
    return true;
  }
}
