document.addEventListener('DOMContentLoaded', async () => {
  // Fetch Publishable Key from backend
  const { publishableKey } = await fetch('/config').then((r) => r.json());
  if (!publishableKey) {
    addMessage('No publishable key returned from the backend. Make sure to provide keys in .env');
  }

  const stripe = Stripe(publishableKey);

  // Fetch PaymentIntent clientSecret
  const { clientSecret } = await fetch('/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  }).then((r) => r.json());

  const elements = stripe.elements({ clientSecret });
  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');

  const form = document.querySelector('#payment-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Change this to your payment completion page
        // return_url: window.location.origin + '/success.html',
      },
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        showMessage(error.message);
      } else {
        showMessage('An unexpected error occurred.');
      }
    }

    setLoading(false);
  });

  // Check for successful payment re-direct status
  const clientSecretParam = new URLSearchParams(window.location.search).get(
    'payment_intent_client_secret'
  );

  if (clientSecretParam) {
    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecretParam);
    switch (paymentIntent.status) {
      case 'succeeded':
        showMessage('Payment succeeded!');
        break;
      case 'processing':
        showMessage('Your payment is processing.');
        break;
      case 'requires_payment_method':
        showMessage('Your payment was not successful, please try again.');
        break;
      default:
        showMessage('Something went wrong.');
        break;
    }
  }
});

function showMessage(messageText) {
  const messageContainer = document.querySelector('#payment-message');
  messageContainer.classList.remove('hidden');
  messageContainer.textContent = messageText;
  
  setTimeout(() => {
    messageContainer.classList.add('hidden');
    messageContainer.textContent = '';
  }, 4000);
}

function setLoading(isLoading) {
  if (isLoading) {
    document.querySelector('#submit').disabled = true;
    document.querySelector('#spinner').classList.remove('hidden');
    document.querySelector('#button-text').classList.add('hidden');
  } else {
    document.querySelector('#submit').disabled = false;
    document.querySelector('#spinner').classList.add('hidden');
    document.querySelector('#button-text').classList.remove('hidden');
  }
}

function addMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.color = 'red';
    messageDiv.style.fontWeight = 'bold';
    messageDiv.innerText = message;
    document.body.prepend(messageDiv);
}
