// Shared test preload: supply safe, documented local development defaults and
// strip inherited secrets that must never leak into tests.
// Mirrors the values in the root .env.example (dev-safe, no real secrets).

const defaults: Record<string, string> = {
  NEXT_PUBLIC_CB_ENVIRONMENT: 'test',
  NEXT_PUBLIC_CODEBUFF_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_FREEBUFF_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPPORT_EMAIL: 'support@example.com',
  NEXT_PUBLIC_POSTHOG_API_KEY: 'phc_test_placeholder',
  NEXT_PUBLIC_POSTHOG_HOST_URL: 'http://localhost:3001',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
  NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL: 'http://localhost:3002',
  NEXT_PUBLIC_WEB_PORT: '3000',
}

for (const [key, value] of Object.entries(defaults)) {
  if (process.env[key] === undefined) {
    process.env[key] = value
  }
}

// Never let an inherited ads Slack webhook leak into tests.
delete process.env.FREEBUFF_ADS_SLACK_WEBHOOK_URL
