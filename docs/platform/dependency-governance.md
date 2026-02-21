# Dependency Governance Standard

## Objective
Guarantee reproducible, secure, and network-resilient dependency installs for all environments.

## Mandatory Controls
1. Use internal npm proxy/mirror only (`NPM_REGISTRY_URL`).
2. Commit and enforce `pnpm-lock.yaml` (`--frozen-lockfile`).
3. Use pinned runtime/toolchain versions (`.node-version`, `packageManager`).
4. Prime cache with `pnpm fetch`, then install offline (`pnpm install --offline`).
5. Block CI when registry points to public npm.

## Required Environment Variables
- `NPM_REGISTRY_URL`: Full URL to internal npm registry/proxy.
- `NPM_REGISTRY_HOST` (optional): Explicit host/path used for auth key.
- `NPM_TOKEN`: Registry auth token for CI/service accounts.

## Local Workflow
```bash
export NPM_REGISTRY_URL="https://npm.meshva.internal/"
export NPM_REGISTRY_HOST="npm.meshva.internal/" # optional
export NPM_TOKEN="<token>"  # optional if registry allows anonymous read
bash scripts/prepare-offline-install.sh
```

## First-Time Bootstrap (One-Time)
If `pnpm-lock.yaml` is not yet committed, generate it once from a trusted environment:

```bash
export NPM_REGISTRY_URL="https://npm.meshva.internal/"
export NPM_REGISTRY_HOST="npm.meshva.internal/" # optional
export NPM_TOKEN="<token>"  # optional if registry allows anonymous read
bash scripts/bootstrap-lockfile.sh
```

Then commit `pnpm-lock.yaml`, and switch all environments back to frozen/offline mode.

## Tooling Wrapper
- `scripts/pnpmw.sh` is the canonical pnpm entrypoint for governance scripts.
- It sets a project-local `COREPACK_HOME` (`.cache/corepack`) to avoid host-specific cache permission issues.

## CI Workflow
1. Configure Node from `.node-version`.
2. Configure pnpm from `packageManager`.
3. Run `scripts/verify-dependency-governance.sh`.
4. Run `pnpm fetch --frozen-lockfile`.
5. Run `pnpm install --offline --frozen-lockfile`.

## Bootstrap Recommendation
Stand up one internal registry proxy (Verdaccio/Nexus/Artifactory) and replicate packages there.
All project repos must reference only that registry.

### Optional Local Registry Bootstrap (Verdaccio)
```bash
docker compose -f infra/docker/docker-compose.registry.yml up -d
```
Default local endpoint: `http://localhost:4873`.
