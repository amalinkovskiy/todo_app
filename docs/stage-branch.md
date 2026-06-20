# Stage Branch

This branch is used for the stage deployment flow.

Expected deployment model:

```text
stage -> Vercel Preview -> stage database -> stage smoke tests
main  -> Vercel Production -> production database
```

The `stage` branch is intentionally separate from `main` so new changes can be deployed and tested before promotion to production.

Current note: until a stage database URL is configured in Vercel Preview environment variables, the stage deployment is expected to report a degraded database state.
