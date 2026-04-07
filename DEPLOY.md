# Deployment Guide for 2maro.io

This guide covers deploying the 2maro.io Astro site to Cloudflare Pages.

## Prerequisites

- **Node.js**: v22.12.0 or higher (check with `node --version`)
- **npm**: v10+ (installed with Node.js)
- **Git**: For pushing code to GitHub
- **Cloudflare Account**: Free tier is sufficient for Pages

## Local Build

### 1. Install Dependencies

```bash
npm install
```

### 2. Build for Production

```bash
npm run build
```

This generates a static site in the `dist/` directory.

### 3. Preview Locally (Optional)

Before deploying, preview the production build locally:

```bash
npm run preview
```

Access the site at `http://localhost:4321/` to verify everything works.

## Cloudflare Pages Deployment

### 1. Connect Your GitHub Repository

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
2. Click **Create a project** → **Connect to Git**
3. Authorize Cloudflare to access your GitHub account
4. Select the `2maro.io` repository
5. Click **Connect account** to proceed

### 2. Configure Build Settings

In the **Build settings** section:

- **Framework preset**: Select **Astro**
- **Build command**: `npm run build`
- **Build output directory**: `dist/`
- **Root directory**: `/` (leave as default)

These settings are critical — they match your `package.json` scripts and Astro's output configuration.

### 3. Set Environment Variables (Optional)

If your site requires environment variables, add them in **Environment variables**:

- Currently, no environment variables are required
- The site URL is configured in `astro.config.mjs` as `https://2maro.io`

If you add custom variables in the future, they must be added here before the build runs.

### 4. Deploy

Click **Save and Deploy**. Cloudflare Pages will:

1. Pull your latest code from GitHub
2. Run `npm install`
3. Run `npm run build`
4. Deploy the `dist/` output to Cloudflare's global CDN

Watch the deployment logs for any errors. A successful build shows a green checkmark.

## Custom Domain Setup

### 1. In Cloudflare Pages Dashboard

1. Go to your project settings → **Custom domain**
2. Click **Set up a custom domain**
3. Enter `2maro.io` (or subdomain)

### 2. Configure DNS Records

Cloudflare Pages will provide DNS instructions. Typically:

- Point your domain's nameservers to Cloudflare's nameservers, or
- Add a CNAME record: `2maro.io` → `2maro-io.pages.dev`

The exact steps depend on where your domain is registered. Cloudflare's UI will guide you.

### 3. Verify HTTPS

Once DNS propagates (typically within minutes), your site is live at `https://2maro.io/` with automatic HTTPS from Cloudflare.

## Project Configuration Details

### Astro Settings (`astro.config.mjs`)

```javascript
export default defineConfig({
  site: 'https://2maro.io',
  integrations: [sitemap()],
  output: 'static',
});
```

- **site**: The canonical URL of your site (used for RSS feeds, sitemaps)
- **output**: `static` means pure HTML/CSS/JS — perfect for Cloudflare Pages
- **integrations**: Currently includes sitemap generator (`@astrojs/sitemap`)

No changes needed unless you change your domain or add new features.

### Node Version

`package.json` specifies `node >= 22.12.0`. Cloudflare Pages automatically uses a compatible version, but your local environment should match.

## Verify Deployment

### Check Cloudflare Dashboard

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
2. Select your `2maro.io` project
3. The **Deployments** tab shows build status and logs
4. Green checkmark = successful deployment

### Test the Live Site

```bash
curl https://2maro.io/
```

Or open `https://2maro.io/` in your browser and verify:
- Pages load without errors
- CSS and images display correctly
- Navigation works as expected

### Check Sitemap

Visit `https://2maro.io/sitemap-index.xml` to verify the sitemap was generated (provided by `@astrojs/sitemap`).

## Troubleshooting

### Build Fails

Check the build logs in Cloudflare Pages dashboard. Common issues:

- **Node version**: Ensure `node >= 22.12.0` locally and in your environment
- **Missing dependencies**: Run `npm install` and commit `package-lock.json`
- **Astro errors**: Run `npm run build` locally to debug

### Site Is Blank or Shows 404

- Verify `output: 'static'` in `astro.config.mjs`
- Confirm `dist/` has an `index.html` file
- Check that build output directory is set to `dist/` in Cloudflare Pages

### DNS Not Resolving

- DNS changes can take 24–48 hours to fully propagate
- Use `dig 2maro.io` to check DNS status
- Verify nameservers are correctly pointed to Cloudflare

## Automatic Deployments

Every push to your main branch will trigger a new deployment automatically. To disable or modify this:

1. Go to Cloudflare Pages project settings → **Build & deployments**
2. Configure branch protection or disable automatic deployments if needed

## Rollback

If a deployment breaks:

1. In Cloudflare Pages **Deployments** tab, click a previous successful deployment
2. Click **Rollback** to instantly revert to that version

No code changes needed — useful for emergency fixes.

---

For more information, see:
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
