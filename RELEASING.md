# Releasing KARG

This document describes the release process for KARG.

## Prerequisites

- Ensure you have push access to the repository
- Ensure all tests pass locally with `bun test`
- Ensure the code is properly formatted with `bunx biome check --fix`

## Release Process

We use a draft-based release workflow that ensures flake.nix contains correct hashes before creating the Git tag. This prevents Nix users from getting hash mismatches.

### Automated Release (Recommended)

1. **Run the release workflow**:

   - Go to [Actions > Release](https://github.com/appthrust/karg/actions/workflows/release.yml)
   - Click "Run workflow"
   - Enter the version number (without the `v` prefix, e.g., `0.1.0`)
   - Click "Run workflow"

2. **The workflow will automatically**:
   - Create a draft release (no Git tag yet)
   - Build binaries for all platforms
   - Upload binaries to the draft release
   - Calculate hashes from the built artifacts
   - Update `flake.nix` with the correct version and hashes
   - Update `README.md` with the correct version in installation examples
   - Commit the updated `flake.nix` and `README.md`
   - Create and push the Git tag
   - Publish the release

### Manual Release Process

If you need to release manually:

1. **Create a draft release**:

   ```bash
   gh release create v0.1.0 \
     --draft \
     --title "v0.1.0" \
     --notes "Release v0.1.0"
   ```

2. **Build and upload binaries**:

   ```bash
   bun scripts/build.ts --version 0.1.0
   gh release upload v0.1.0 dist/*.tar.gz
   ```

3. **Update flake.nix with hashes**:

   ```bash
   bun scripts/update-flake.ts --version 0.1.0
   ```

4. **Update README.md**:

   ```bash
   bun scripts/update-readme.ts --version 0.1.0
   ```

5. **Commit the changes**:

   ```bash
   git add flake.nix README.md
   git commit -m "chore: update flake.nix and README.md for v0.1.0"
   ```

6. **Create and push the tag**:

   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin main --tags
   ```

7. **Update and publish the release**:
   ```bash
   gh release edit v0.1.0 --target "$(git rev-parse v0.1.0)" --draft=false
   ```

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality additions
- PATCH version for backwards-compatible bug fixes

## Testing the Release

After releasing, test the installation methods:

```bash
# Test devbox installation
devbox add github:appthrust/karg/v0.1.0#karg
devbox run karg --help

# Test nix installation
nix run github:appthrust/karg/v0.1.0#karg -- --help
```

## Troubleshooting

If the release workflow fails:

1. Check the GitHub Actions logs for errors
2. Ensure all platforms build successfully locally with:
   ```bash
   bun scripts/build.ts --version 0.1.0
   ```
3. Manually upload missing assets if needed

## Manual Flake Update

If the automatic PR creation fails, you can manually update the flake:

```bash
# Update flake.nix with new hashes from local artifacts
bun scripts/update-flake.ts --version 0.1.0
```

## Why Draft-Based Releases?

This workflow solves a critical issue with Nix Flakes:

1. **Traditional flow**: Create tag → Build → Upload assets → Update flake

   - Problem: Tag points to commit without correct hashes
   - Users get hash mismatches when using the tagged version

2. **Draft-based flow**: Draft release → Build → Update flake → Create tag → Publish
   - Solution: Tag points to commit with correct hashes
   - Users always get working flake references

## Jetify Cache (Optional)

To speed up installations for users, you can upload to Jetify Cache:

```bash
devbox cache upload github:appthrust/karg/v0.1.0#karg
```
