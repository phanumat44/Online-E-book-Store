'use client';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Access public key from backend
const stripePromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/config`)
    .then(r => r.json())
    .then(data => loadStripe(data.publishableKey));

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // return_url: `${window.location.origin}/success`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
    } else {
      setMessage("An unexpected error occurred.");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={isLoading || !stripe || !elements} className="btn" style={{ width: '100%', marginTop: '20px' }}>
        {isLoading ? "Processing..." : "Pay now"}
      </button>
      {message && <div style={{ color: 'red', marginTop: '10px' }}>{message}</div>}
    </form>
  );
}

export default function CheckoutPage({ params }) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: params.id }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, [params.id]);

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <div className="container" style={{ maxWidth: '500px' }}>
      <h1>Unknown Product</h1> {/* You might want to fetch product details to display name/price here too */}
      <h1 className="mb-4">Secure Checkout</h1>
      {clientSecret ? (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      ) : (
        <p>Initializing payment...</p>
      )}
    </div>
  );
}
