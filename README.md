# Centen landing page

A static marketing and early-access page for Centen: a privacy-first health-routine coach that begins with adaptive walking support and can grow across movement, nourishment, recovery, mental wellbeing, and connection.

## Run locally

The site has no build step. From the repository root, serve the directory with any static web server, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Waitlist setup

The page is ready to collect the name, email address, and primary interest. It deliberately does not send personal data anywhere until a collection provider is selected.

1. Create a form endpoint with a provider such as Formspree, Basin, or your own privacy-reviewed API.
2. In `script.js`, set `waitlistEndpoint` to that HTTPS endpoint.
3. Test a submission and confirm the provider's privacy notice and retention settings before publishing.

Until then, submissions are stored only in the visitor's own browser as a preview, and no data leaves their device. This lets the prototype demonstrate the success state without pretending to have captured a registration.

## Deploy to GitHub Pages

The included workflow publishes the repository root whenever `main` changes.

1. Push this repository to GitHub.
2. Open the repository **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Push or re-run the **Deploy static site to GitHub Pages** workflow from the Actions tab.
5. GitHub will show the published URL in the workflow summary and in Settings → Pages.

No secrets are required for the static page. The waitlist provider may require an endpoint or provider-side configuration; do not commit a private API key into this repository.
