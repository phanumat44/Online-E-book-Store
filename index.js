require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

app.get("/health", (req, res) => {
    res.send("healthy!");
});

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "thb",
      amount: 1999, // 19.99 THB
      payment_method_types: ["card", "promptpay"],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.listen(port, () => {
    console.log(`backend listening on port ${port}`);
});
