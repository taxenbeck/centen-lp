const form = document.querySelector('#waitlist-form');
const status = document.querySelector('#form-status');
const waitlistEndpoint = ''; // Add a Formspree or similar endpoint here before public launch.

document.querySelector('#year').textContent = new Date().getFullYear();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = form.elements.email;
  if (!email.validity.valid) {
    status.textContent = 'Please enter a valid email address.';
    email.focus();
    return;
  }
  const data = Object.fromEntries(new FormData(form));
  if (!waitlistEndpoint) {
    localStorage.setItem('centen-waitlist-preview', JSON.stringify({ ...data, submittedAt: new Date().toISOString() }));
    form.reset();
    status.textContent = 'Preview saved on this device. Connect the waitlist service to start collecting registrations.';
    return;
  }
  try {
    const response = await fetch(waitlistEndpoint, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Waitlist submission failed');
    form.reset();
    status.textContent = 'You’re on the list. We’ll be in touch soon.';
  } catch {
    status.textContent = 'Something went wrong. Please try again in a moment.';
  }
});

const dialog = document.querySelector('#explainer');
document.querySelectorAll('[data-open-explainer]').forEach((button) => button.addEventListener('click', () => dialog.showModal()));
document.querySelectorAll('[data-close-explainer]').forEach((button) => button.addEventListener('click', () => dialog.close()));
