# Neptune Logistics Website

Static corporate website for Neptune Logistics (Pvt) Ltd. The site is built with plain HTML, CSS, and JavaScript, then deployed through Vercel from the GitHub repository.

## Project Structure

- `index.html` is the home page.
- `about.html`, `portfolio.html`, and `contact.html` are the main company pages.
- `services/` contains the service detail pages.
- `industries/` contains industry specific landing pages.
- `components/navbar.html` is loaded into pages by `js/navbar-loader.js`.
- `css/` contains shared and page level styles.
- `js/` contains navigation, animation, services explorer, form, and analytics scripts.
- `assets/` contains logos, icons, and image assets.

## Run Locally

From the project root:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

You can also use a local static server such as the VS Code Live Server extension.

## Forms

The contact form submits through the Supabase Edge Function at `supabase/functions/send-contact-email`. The function sends all website enquiries to `info@neptunelogistics.lk`. Web3Forms remains as a fallback in `js/animations.js`.

Deploy the function and set the mail provider secret before relying on Supabase email delivery:

```bash
supabase functions deploy send-contact-email
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set FROM_EMAIL="Neptune Logistics <noreply@neptunelogistics.lk>"
```

The newsletter subscription still submits through Web3Forms. The Web3Forms account controls the destination inbox for newsletter submissions.

## Analytics

The site includes `js/analytics.js` for Google Analytics 4. To activate live analytics, set the GA4 measurement ID before loading the script:

```html
<script>window.NEPTUNE_GA4_ID = 'G-XXXXXXXXXX';</script>
<script src="js/analytics.js"></script>
```

Use the correct relative path for pages inside folders, such as `../js/analytics.js`.

## Deployment

Push changes to the connected GitHub branch. Vercel will build and publish the static site automatically.

## Repository Notes

`.DS_Store` and `scratch/` are ignored and should not be committed.
