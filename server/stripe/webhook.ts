import Stripe from "stripe";
import type { Request, Response } from "express";
import { getDb, updateUser } from "../db";
import { users, creditTransactions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { PLANS, getTierFromPlan } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Test events — retourner verified: true
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        const purchaseType = session.metadata?.type;

        // ─── Credit pack / custom credits purchase ─────────────────────
        if (userId && (purchaseType === "credit_pack" || purchaseType === "custom_credits")) {
          const creditsToAdd = parseInt(session.metadata?.credits || "0", 10);
          const packId = session.metadata?.pack_id || "unknown";
          if (!Number.isFinite(creditsToAdd) || creditsToAdd <= 0) {
            console.warn(`[Stripe] Credit pack purchase ignored — invalid credits metadata for user ${userId}`);
            break;
          }
          const db = await getDb();
          if (db) {
            const rows = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
            const user = rows[0];
            if (user) {
              const newBalance = (user.credits || 0) + creditsToAdd;
              await db.update(users)
                .set({ credits: newBalance })
                .where(eq(users.id, user.id));
              await db.insert(creditTransactions).values({
                userId: user.id,
                amount: creditsToAdd,
                type: "purchase",
                description: purchaseType === "custom_credits"
                  ? `Achat montant libre — ${session.metadata?.amount_eur || "?"}€ (${creditsToAdd} crédits)`
                  : `Achat pack crédits — ${packId} (${creditsToAdd} crédits)`,
                balanceAfter: newBalance,
              });
              console.log(`[Stripe] User ${userId} purchased ${creditsToAdd} credits via ${packId} | balance: ${newBalance}`);
            } else {
              console.warn(`[Stripe] Credit purchase — user ${userId} not found`);
            }
          }
          break;
        }

        // ─── Subscription plan purchase ─────────────────────────────────
        if (userId && planId) {
          const plan = PLANS[planId as keyof typeof PLANS];
          if (plan) {
            const tier = getTierFromPlan(planId);
            // isCercle=true si le plan est cercle (elite) ou duo (explorer)
            const isCercle = planId === "cercle" || tier === "elite";
            const db = await getDb();
            if (db) await db.update(users)
              .set({
                subscriptionTier: tier,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                credits: plan.credits,
                isCercle: isCercle,
              })
              .where(eq(users.id, parseInt(userId)));
            console.log(`[Stripe] User ${userId} upgraded to ${planId} | isCercle: ${isCercle}`);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Retrouver l'utilisateur par stripeCustomerId
        const db1 = await getDb();
        const userRows = db1 ? await db1.select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1) : [];

        if (userRows.length > 0) {
          const user = userRows[0];
          // Crédits de grâce : 5 crédits offerts à l'annulation (anti-abus : max 1 fois par 30j)
          const GRACE_CREDITS = 5;
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          let graceAlreadyGiven = false;
          if (db1) {
            const recentGrace = await db1.select()
              .from(creditTransactions)
              .where(eq(creditTransactions.userId, user.id))
              .limit(100);
            graceAlreadyGiven = recentGrace.some(
              (t: any) => t.type === 'grace' && new Date(t.createdAt) > thirtyDaysAgo
            );
          }
          const newCredits = graceAlreadyGiven ? 0 : GRACE_CREDITS;
          if (db1) {
            await db1.update(users)
              .set({
                subscriptionTier: "free",
                stripeSubscriptionId: null,
                credits: newCredits,
                isCercle: false,
              })
              .where(eq(users.id, user.id));
            if (!graceAlreadyGiven) {
              await db1.insert(creditTransactions).values({
                userId: user.id,
                amount: GRACE_CREDITS,
                type: 'grace',
                description: 'Crédits de grâce à la résiliation — merci pour votre confiance',
                balanceAfter: GRACE_CREDITS,
              });
            }
          }
          console.log(`[Stripe] User ${user.id} downgraded to free | grace: ${!graceAlreadyGiven} | credits: ${newCredits}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Renouvellement mensuel — recharger les crédits
        const db2 = await getDb();
        const userRows2 = db2 ? await db2.select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1) : [];

        if (userRows2.length > 0) {
          const user = userRows2[0];
          const planKey = user.subscriptionTier === "elite" ? "cercle" : (user.subscriptionTier === "premium" ? "membre" : "invite");
          const plan = PLANS[planKey as keyof typeof PLANS];
          if (plan && plan.credits > 0) {
            // Rollover : ajouter les crédits, cap à 3x
            const newBalance = Math.min(
              (user.credits || 0) + plan.credits,
              plan.rolloverCap
            );
            if (db2) await db2.update(users)
              .set({ credits: newBalance })
              .where(eq(users.id, user.id));
            console.log(`[Stripe] User ${user.id} credits renewed: ${newBalance}`);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ─── Créer une session Checkout ───────────────────────────────────
export async function createCheckoutSession({
  userId,
  userEmail,
  userName,
  planId,
  origin,
}: {
  userId: number;
  userEmail: string;
  userName?: string;
  planId: string;
  origin: string;
}): Promise<string> {
  const plan = PLANS[planId as keyof typeof PLANS];
  if (!plan || !plan.stripePriceId) {
    throw new Error(`Plan invalide: ${planId}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      plan_id: planId,
      customer_email: userEmail,
      customer_name: userName || "",
    },
    success_url: `${origin}/mon-espace?payment=success&plan=${planId}`,
    cancel_url: `${origin}/pricing?payment=cancelled`,
  });

  return session.url || "";
}

// ─── Créer une session Checkout one-shot (feature unlock) ────────
export async function createFeatureUnlockSession({
  userId,
  userEmail,
  featureId,
  priceCents,
  featureName,
  origin,
}: {
  userId: number;
  userEmail: string;
  featureId: string;
  priceCents: number;
  featureName: string;
  origin: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: featureName },
          unit_amount: priceCents,
        },
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      feature_id: featureId,
      customer_email: userEmail,
    },
    success_url: `${origin}/mon-espace?feature=${featureId}&unlocked=true`,
    cancel_url: `${origin}/pricing`,
  });

  return session.url || "";
}
