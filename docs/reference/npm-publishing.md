# npm Publishing

This document describes how maintainers prepare and publish the `chinacode` npm package. Do not publish from automation unless the release owner explicitly approves it.

## Package Contract

- Package name: `chinacode`
- Binary command: `chinacode`
- Runtime entrypoint: `dist/index.js`
- Supported Node.js version: `>=20.0.0`
- Public package access: `public`

After publication, users should be able to run:

```bash
npx chinacode
```

or install globally:

```bash
npm install -g chinacode
chinacode
```

## Release Checklist

1. Confirm the working tree contains only intended release changes.

   ```bash
   git status --short
   ```

2. Install dependencies from the lockfile.

   ```bash
   npm ci
   ```

3. Run verification.

   ```bash
   npm run typecheck
   npm run test:run
   npm run build
   ```

4. Confirm the generated CLI entrypoint exists and has a Node shebang.

   ```bash
   head -n 1 dist/index.js
   ```

   Expected output:

   ```text
   #!/usr/bin/env node
   ```

5. Inspect the package contents without publishing.

   ```bash
   npm pack --dry-run
   ```

   The tarball should include `dist/`, `README.md`, `CHANGELOG.md`, selected `docs/`, and `package.json`. It should not include source files, local secrets, test output, `node_modules/`, or coverage reports.

6. Verify the package metadata.

   ```bash
   npm pkg get name version bin engines files publishConfig repository bugs homepage
   ```

7. Update `CHANGELOG.md` for the release version and date.

8. Authenticate with npm using the maintainer account.

   ```bash
   npm whoami
   ```

9. Publish manually from the repository root.

   ```bash
   npm publish
   ```

10. Validate the published package from a clean temporary directory.

    ```bash
    npx chinacode
    ```

## Pre-Release Dry Run

Use this command when reviewing package shape during development:

```bash
npm pack --dry-run
```

This command does not publish to the network. It only reports which files would be included in the npm tarball.

## Rollback Notes

npm package versions are immutable after publication. If a broken version is published:

1. Publish a fixed patch version.
2. Deprecate the broken version with a clear message.
3. Update `CHANGELOG.md` with the corrective release.

Avoid unpublishing unless npm policy allows it and the maintainer has explicitly approved the action.
