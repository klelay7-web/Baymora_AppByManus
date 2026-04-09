/**
 * reminderService.ts
 * Vérifie quotidiennement les parcours actifs et crée des notifications de rappel.
 * Appelé par un cron job ou au démarrage du serveur.
 */

interface TripPlanRow {
  id: number;
  userId: number;
  title: string;
  destinationCity: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface NotificationInsert {
  userId: number;
  title: string;
  message: string;
  type: string;
}

async function insertNotification(notif: NotificationInsert): Promise<void> {
  try {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
    await conn.execute(
      "INSERT INTO notifications (userId, title, message, type, createdAt) VALUES (?, ?, ?, ?, NOW())",
      [notif.userId, notif.title, notif.message, notif.type]
    );
    await conn.end();
  } catch (err) {
    console.error("[reminderService] insertNotification error:", err);
  }
}

async function sendReminderEmail(userId: number, subject: string, body: string): Promise<void> {
  try {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);
    const [rows] = await conn.execute("SELECT email FROM users WHERE id = ?", [userId]) as any;
    await conn.end();
    if (!rows[0]?.email) return;

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Maison Baymora <noreply@baymora.fr>",
      to: rows[0].email,
      subject,
      html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#070B14;color:#F0EDE6;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:32px;color:#C8A96E;font-family:Georgia,serif;">✦ Maison Baymora</span>
        </div>
        <div style="font-size:16px;line-height:1.6;">${body}</div>
        <div style="margin-top:32px;text-align:center;font-size:12px;color:#6B7280;">
          Maison Baymora — Votre accès privé premium
        </div>
      </div>`,
    });
  } catch (err) {
    console.error("[reminderService] sendReminderEmail error:", err);
  }
}

export async function runDailyReminders(): Promise<void> {
  console.log("[reminderService] Running daily reminders...");

  try {
    const mysql = await import("mysql2/promise");
    const conn = await mysql.default.createConnection(process.env.DATABASE_URL!);

    // Récupérer tous les plans actifs ou validés avec une date de départ
    const [rows] = await conn.execute(
      `SELECT id, userId, title, destinationCity, startDate, endDate, status
       FROM tripPlans
       WHERE status IN ('valide', 'en_cours', 'brouillon')
       AND startDate IS NOT NULL`
    ) as any;
    await conn.end();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const plan of rows as TripPlanRow[]) {
      const startDate = new Date(plan.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = plan.endDate ? new Date(plan.endDate) : null;
      if (endDate) endDate.setHours(0, 0, 0, 0);

      const daysUntilStart = Math.round((startDate.getTime() - today.getTime()) / 86400000);
      const daysAfterEnd = endDate
        ? Math.round((today.getTime() - endDate.getTime()) / 86400000)
        : null;

      const dest = plan.destinationCity || "votre destination";

      // J-14
      if (daysUntilStart === 14) {
        await insertNotification({
          userId: plan.userId,
          title: `✈️ J-14 : ${dest} approche !`,
          message: `Ton voyage à ${dest} est dans 14 jours. Pense à vérifier ton passeport, ton assurance voyage et ta valise.`,
          type: "trip",
        });
        await sendReminderEmail(
          plan.userId,
          `✈️ J-14 : Votre voyage à ${dest} approche`,
          `<p>Votre voyage à <strong>${dest}</strong> est dans <strong>14 jours</strong>.</p>
           <p>Pensez à :</p>
           <ul>
             <li>Vérifier la validité de votre passeport</li>
             <li>Souscrire une assurance voyage</li>
             <li>Commencer votre liste de valise</li>
           </ul>
           <p>Maya peut vous aider à préparer votre voyage !</p>`
        );
      }

      // J-7
      if (daysUntilStart === 7) {
        await insertNotification({
          userId: plan.userId,
          title: `🗓️ J-7 : Vos réservations pour ${dest}`,
          message: `Plus qu'une semaine avant ${dest} ! Vos réservations sont confirmées. Consultez vos contacts d'urgence dans l'app.`,
          type: "trip",
        });
        await sendReminderEmail(
          plan.userId,
          `🗓️ J-7 : Votre voyage à ${dest} dans une semaine`,
          `<p>Plus qu'une semaine avant votre voyage à <strong>${dest}</strong> !</p>
           <p>Vos réservations sont confirmées. N'oubliez pas de consulter vos contacts d'urgence dans l'application.</p>`
        );
      }

      // J-3
      if (daysUntilStart === 3) {
        await insertNotification({
          userId: plan.userId,
          title: `🌤️ J-3 : Météo et valise pour ${dest}`,
          message: `Dans 3 jours tu pars à ${dest} ! Vérifie la météo prévue et adapte ta valise en conséquence.`,
          type: "trip",
        });
      }

      // J-1
      if (daysUntilStart === 1) {
        await insertNotification({
          userId: plan.userId,
          title: `🎒 Demain c'est le jour J ! ${dest} t'attend`,
          message: `Voici ta todolist de départ : documents, chargeurs, réservations imprimées, contacts d'urgence. Bon voyage !`,
          type: "trip",
        });
        await sendReminderEmail(
          plan.userId,
          `🎒 Demain : Votre voyage à ${dest}`,
          `<p>Demain c'est le grand départ pour <strong>${dest}</strong> !</p>
           <p>Votre todolist de départ :</p>
           <ul>
             <li>✅ Documents de voyage (passeport, billets)</li>
             <li>✅ Chargeurs et adaptateurs</li>
             <li>✅ Réservations (hôtel, restaurants)</li>
             <li>✅ Contacts d'urgence sauvegardés</li>
           </ul>
           <p><strong>Bon voyage !</strong></p>`
        );
      }

      // J+retour (+1 jour après la fin)
      if (daysAfterEnd === 1) {
        await insertNotification({
          userId: plan.userId,
          title: `🌟 Comment était ${dest} ?`,
          message: `Tu viens de rentrer de ${dest}. Note tes coups de cœur et partage ton expérience avec la communauté Baymora !`,
          type: "trip",
        });
      }

      // +3j si scénario brouillon
      if (plan.status === "brouillon") {
        const createdAt = new Date(plan.startDate); // approximation
        const daysSinceCreated = Math.round((today.getTime() - createdAt.getTime()) / 86400000);
        if (daysSinceCreated === 3) {
          await insertNotification({
            userId: plan.userId,
            title: `💡 Votre scénario ${dest} vous attend`,
            message: `Vous avez sauvegardé un scénario pour ${dest} il y a 3 jours. On le finalise ensemble ?`,
            type: "system",
          });
        }
      }
    }

    console.log(`[reminderService] Processed ${(rows as TripPlanRow[]).length} trip plans.`);
  } catch (err) {
    console.error("[reminderService] Error:", err);
  }
}

// Cron quotidien — à appeler depuis server/index.ts ou un scheduler
export function startReminderCron(): void {
  // Exécuter une fois au démarrage (pour les tests)
  setTimeout(() => {
    runDailyReminders().catch(console.error);
  }, 5000);

  // Puis toutes les 24h
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    runDailyReminders().catch(console.error);
  }, TWENTY_FOUR_HOURS);

  console.log("[reminderService] Cron started (daily).");
}
