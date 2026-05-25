# CI/CD Reference

This project uses GitHub Actions for validation, security reporting, and tagged releases.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`.

The `verify` job installs dependencies with `npm ci` and runs the existing package scripts:

- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run build`

The `coverage` job runs Vitest coverage with:

```sh
npm run test:run -- --coverage
```

The generated `coverage/` directory is uploaded as a workflow artifact.

## Security checks

The `security` job runs:

- `npm audit --json`, uploaded as `npm-audit.json`
- `npm audit --audit-level=high`, which fails the workflow for high or critical advisories
- `npm sbom --sbom-format=cyclonedx`, uploaded as `sbom.cdx.json`

## Releases

`.github/workflows/release.yml` runs when a tag matching `v*.*.*` is pushed.

The release job repeats the validation steps, builds the package, generates a CycloneDX SBOM, packs the npm tarball, creates a Sigstore-backed GitHub artifact attestation with `actions/attest-build-provenance`, and publishes to npm with:

```sh
npm publish <package.tgz> --provenance --access public
```

The workflow requires the repository secret `NPM_TOKEN` to contain an npm automation token with publish access. GitHub OIDC is enabled through the workflow `id-token: write` permission so npm can attach provenance to the published package.

After publishing, the workflow creates a GitHub release for the pushed tag and uploads the package tarball and SBOM.

## Dependency updates

`.github/dependabot.yml` checks npm dependencies and GitHub Actions weekly. npm updates are grouped into production and development dependency pull requests.
