# Centen landing page

A static marketing and early-access page for Centen: a privacy-first health-routine coach that begins with adaptive walking support and can grow across movement, strength, sleep, and alcohol-free days.

## Run locally

The site has no build step. From the repository root, serve the directory with any static web server, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Waitlist setup (Brevo)

The form posts to a Brevo signup form (free plan, EU-hosted). Until `waitlistEndpoint` in `script.js` is set, submissions are stored only in the visitor's own browser as a preview and no data leaves their device.

1. In Brevo, open **Contacts → Settings → Contact attributes** and add a text attribute `INTEREST`. `FIRSTNAME` already exists.
2. Create a list (for example "Centen waitlist").
3. Go to **Contacts → Forms → Create a subscription form**. Add the fields Email, FIRSTNAME and INTEREST, pick the list, and turn on **double opt-in** with a confirmation email.
4. On the **Share** step, copy the embed HTML and take the URL from `<form action="https://…sibforms.com/serve/…">`.
5. Paste that URL into `waitlistEndpoint` in `script.js`, push, and test one sign-up end to end.

The form field names (`EMAIL`, `FIRSTNAME`, `INTEREST`, the `email_address_check` honeypot and `locale`) match Brevo's embed form.

## Deploy to GitHub Pages

The included workflow publishes the repository root whenever `main` changes.

1. Push this repository to GitHub.
2. Open the repository **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Push or re-run the **Deploy static site to GitHub Pages** workflow from the Actions tab.
5. GitHub will show the published URL in the workflow summary and in Settings → Pages.

No secrets are required for the static page. The waitlist provider may require an endpoint or provider-side configuration; do not commit a private API key into this repository.
