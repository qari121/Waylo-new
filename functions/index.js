// index.js (Firebase Functions v2)

const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const OpenAI = require("openai");
const Stripe = require("stripe");

// Bind secrets from Firebase Secrets Manager
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");

/**
 * Set CORS headers for the response
 * @param {Object} res - Express response object
 */
function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*"); // tighten in prod
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// ---------- summarize ----------
exports.summarize = onRequest({secrets: [OPENAI_API_KEY]}, async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).send("");

  const {text} = req.body || {};
  if (!text) return res.status(400).json({error: "No text provided"});

  try {
    const openai = new OpenAI({apiKey: OPENAI_API_KEY.value()});

    const systemPrompt =
      "You are an assistant that summarizes chat logs between a child and an AI pet " +
      "named Waylo. Respond with exactly three lines:\n" +
      "Summary: <1-2 sentence summary of the conversation>\n" +
      "Interest of child: <max 2 sentences about the child's interests>\n" +
      "Suggestion to parents: <max 2 sentences with suggestions for the parents " +
      "based on the chat>\n" +
      "If something is unclear, still include the section and say 'Based on the limited " +
      "conversation…'";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: text},
      ],
      max_tokens: 300,
    });

    const summary = completion.choices?.[0]?.message?.content ?? "";
    return res.json({summary});
  } catch (err) {
    console.error("summarize error:", {
      message: err?.message,
      status: err?.status,
      data: err?.response?.data,
    });
    return res.status(500).json({error: err?.message || "Unknown error"});
  }
});

// ---------- createPaymentIntent ----------
exports.createPaymentIntent = onRequest(
    {secrets: [STRIPE_SECRET_KEY]},
    async (req, res) => {
      setCors(res);
      if (req.method === "OPTIONS") return res.status(204).send("");

      try {
        const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
          apiVersion: "2023-10-16",
        });

        const customer = await stripe.customers.create();
        const ephemeralKey = await stripe.ephemeralKeys.create(
            {customer: customer.id},
            {apiVersion: "2023-10-16"},
        );
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 1000, // $10.00
          currency: "usd",
          customer: customer.id,
        });

        return res.json({
          paymentIntent: paymentIntent.client_secret,
          ephemeralKey: ephemeralKey.secret,
          customer: customer.id,
        });
      } catch (err) {
        console.error("createPaymentIntent error:", {
          message: err?.message,
          type: err?.type,
          code: err?.code,
        });
        return res.status(500).json({
          error: err?.message || "Unknown error",
        });
      }
    },
);
