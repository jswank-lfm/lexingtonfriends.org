# Contact Form Cloudflare Worker

This Cloudflare Worker handles contact form submissions for Lexington Friends Meeting website. It validates reCAPTCHA, sends emails via Mailjet, and handles CORS.

## Features

- reCAPTCHA validation using Google's API
- Email delivery via Mailjet API
- CORS support for cross-origin requests
- Form data validation
- Error handling and logging

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Secrets

**Important**: Secrets are managed out-of-band and not stored in the git repository.

#### Method 1: Manual Secret Management (Recommended)

Set secrets using Wrangler CLI before each deployment:

```bash
# Set secrets manually (you'll be prompted for values)
wrangler secret put RECAPTCHA_KEY
wrangler secret put MAILJET_API_KEY
wrangler secret put MAILJET_API_SECRET
```

#### Method 2: Script-Based Secret Management

Create a local script (not checked into git) to manage secrets:

```bash
# Create secrets.sh (add to .gitignore)
cat > secrets.sh << 'EOF'
#!/bin/bash
# secrets.sh - DO NOT CHECK INTO GIT

echo "Setting Cloudflare Worker secrets..."

echo "$RECAPTCHA_SECRET" | wrangler secret put RECAPTCHA_KEY
echo "$MAILJET_API_KEY" | wrangler secret put MAILJET_API_KEY  
echo "$MAILJET_SECRET" | wrangler secret put MAILJET_API_SECRET

echo "Secrets updated successfully"
EOF

chmod +x secrets.sh
echo "secrets.sh" >> .gitignore
```

Then export your secrets as environment variables and run the script:

```bash
export RECAPTCHA_SECRET="your-recaptcha-secret"
export MAILJET_API_KEY="your-mailjet-key"
export MAILJET_SECRET="your-mailjet-secret"
./secrets.sh
```

#### Method 3: Environment File (Local Development)

For local development, create `.env.local` (add to .gitignore):

```bash
# .env.local - DO NOT CHECK INTO GIT
RECAPTCHA_KEY=your-recaptcha-secret
MAILJET_API_KEY=your-mailjet-key
MAILJET_API_SECRET=your-mailjet-secret
```

Use with local development:

```bash
wrangler dev --local --env-file .env.local
```

#### Method 4: External Secret Management

If using a password manager or CI/CD system:

```bash
# Example using 1Password CLI
wrangler secret put RECAPTCHA_KEY --stdin <<< $(op read "op://vault/recaptcha/secret")
wrangler secret put MAILJET_API_KEY --stdin <<< $(op read "op://vault/mailjet/apikey")
wrangler secret put MAILJET_API_SECRET --stdin <<< $(op read "op://vault/mailjet/secret")
```

Get secret values from:
- **reCAPTCHA**: Google reCAPTCHA Admin Console
- **Mailjet**: Mailjet Account Settings > API Key Management

### 3. Environment Variables

The following environment variables are configured in `wrangler.jsonc`:

- `ORIGIN`: Allowed origin for CORS (https://lexingtonfriends.org)
- `MAIL_FROM`: Sender email address
- `MAIL_TO`: Recipient email address
- `MAIL_SUBJECT_PREFIX`: Email subject prefix

## Development

### Local Development

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787/`


## Deployment

### 1. Deploy Worker

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

After deployment, note the worker URL (e.g., `https://contactform.your-subdomain.workers.dev`)

### 2. Configure Custom Route (Optional)

To serve the worker at `lexingtonfriends.org/contact/`, you have two options:

#### Option A: Cloudflare Routes (Recommended)

1. In Cloudflare Dashboard, go to Workers & Pages > contactform
2. Go to Settings > Triggers > Routes
3. Add route: `lexingtonfriends.org/contact/*`
4. Select zone: `lexingtonfriends.org`

This will make POST requests to `https://lexingtonfriends.org/contact/` route to your worker while allowing CloudFront to continue serving your static site.

#### Option B: CloudFront Origin Request Lambda

If you prefer to keep everything in AWS, create a Lambda@Edge function to proxy POST requests to `/contact/` to your Cloudflare Worker URL.

### 3. Update Frontend

Update your contact form to POST to:
- `https://lexingtonfriends.org/contact/` (if using Cloudflare Routes)
- `https://contactform.your-subdomain.workers.dev` (if using direct worker URL)

## API

### POST /

Accepts form data with the following fields:

- `name` (required): Sender's name
- `email` (required): Sender's email address
- `phone` (optional): Sender's phone number
- `subject` (required): Email subject
- `message` (required): Email message
- `g-recaptcha-response` (required): reCAPTCHA response token

### Response

- **200**: Email sent successfully
- **400**: Missing required fields or reCAPTCHA validation failed
- **405**: Method not allowed (only POST accepted)
- **500**: Server error

### CORS

The worker handles CORS preflight requests and includes appropriate headers for cross-origin requests from the configured origin.

## Migration Notes

This worker replaces the previous Google Cloud Functions implementation and migrates from SendGrid to Mailjet for email delivery while maintaining the same functionality and API.