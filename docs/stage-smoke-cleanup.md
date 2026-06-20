# Stage Smoke Cleanup

Stage smoke tests are allowed to create temporary TODO records, but they must clean up only their own data.

## Ownership marker

All automated stage smoke records use this text prefix:

```text
stage-smoke-
```

## Cleanup strategy

The stage TODO smoke test performs cleanup in two places:

1. before the CRUD flow starts;
2. after the CRUD flow finishes.

The cleanup lists `/api/todos` and deletes only TODOs whose `text` starts with `stage-smoke-`.

## Why not delete everything?

Stage may contain manual exploratory data. Automated tests must not erase records they did not create.

This keeps the stage database usable while still preventing failed test runs from leaving smoke-test garbage behind.

## Production rule

This cleanup pattern is for stage only. Production tests must not create or delete real business data unless a dedicated safe test-data strategy exists.
