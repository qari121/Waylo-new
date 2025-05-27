/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

require("dotenv").config();

const functions = require("firebase-functions");
const OpenAI = require("openai");
const Stripe = require("stripe");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Use the key from Firebase config
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY,
    {apiVersion: "2023-10-16"},
);

exports.summarize = functions.https.onRequest(async (req, res) => {
  // Allow CORS for local testing (optional, remove in production if not needed)
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const {text} = req.body;
  if (!text) return res.status(400).json({error: "No text provided"});

  try {
    const systemPrompt =
      "You are an assistant that summarizes  " +
      "chat logs between a child and an AI " +
      "pet named Waylo. Your response MUST be in the following " +
      "format, with each section on a new line:\n" +
      "Summary: <1-2 sentence summary of the conversation>\n" +
      "Interest of child: <max 2 sentences about the child's interests>\n" +
      "Suggestion to parents: <max 2 sentences with suggestions for the " +
      "parents based on the chat>\n" +
      "Do NOT combine sections. Do NOT omit any section. " +
      "Do NOT add extra text. " +
      "Always use line breaks exactly as shown above."
    ;
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_tokens: 300,
    });
    const summary = completion.choices[0].message.content;
    res.json({summary});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
        {customer: customer.id},
        {apiVersion: "2023-10-16"},
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00 in cents
      currency: "usd",
      customer: customer.id,
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});
