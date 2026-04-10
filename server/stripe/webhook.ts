import Stripe from "stripe";
import type { Request, Response } from "express";
import { getDb, updateUser } from "../db";
import { users } from "../../drizzle/schema";
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
          if (db1) await db1.update(users)
            .set({
              subscriptionTier: "free",
              stripeSubscriptionId: null,
              credits: 15,
              isCercle: false, // Retrait automatique du Cercle à l'annulation
            })
            .where(eq(users.id, userRows[0].id));
          console.log(`[Stripe] User ${userRows[0].id} downgraded to free | isCercle: false`);
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
