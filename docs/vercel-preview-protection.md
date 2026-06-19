# Vercel Preview Protection Bypass

Stage smoke tests run from GitHub Actions against the Vercel Preview deployment for the `stage` branch.

If Vercel Preview deployments are protected, GitHub Actions needs an automation bypass secret. Without it, tests may fail even when the stage URL works in a browser where the user is logged in to Vercel.

## Setup

1. Open the Vercel project.
2. Go to deployment protection settings.
3. Generate or copy the automation bypass secret.
4. Add it to GitHub repository secrets as:

```text
VERCEL_AUTOMATION_BYPASS_SECRET
```

## How it is used

The `stage-smoke.yml` workflow exposes this secret as an environment variable during the job.

`playwright.stage.config.ts` adds these headers when the secret is available:

```text
x-vercel-protection-bypass: <secret>
x-vercel-set-bypass-cookie: true
```

If the secret is not configured and the Preview deployment is public, the tests still run normally.
