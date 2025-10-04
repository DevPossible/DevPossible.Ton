# CI/CD Pipeline Documentation

**DevPossible.Ton - Continuous Integration and Deployment**

This document describes the automated build, test, and publish pipeline for the DevPossible.Ton library.

## Overview

The CI/CD pipeline uses GitHub Actions to:
1. **Build and test** all packages on commits to `main` and `dev` branches
2. **Auto-publish** packages to public repositories when version changes
3. **Maintain version sync** across C#, JavaScript, and Python packages
4. **Create GitHub releases** automatically

## Workflows

### 1. Build and Test (`.github/workflows/build.yml`)

**Triggers:**
- Push to `main` or `dev` branches
- Pull requests to `main` or `dev` branches

**Jobs:**
- **build-csharp**: Builds and tests .NET package
- **build-javascript**: Builds and tests npm package
- **build-python**: Builds and tests Python package (Python 3.8-3.12)

**Status:** Runs on every commit to ensure code quality

### 2. Publish Packages (`.github/workflows/publish.yml`)

**Triggers:**
- Push to `main` branch
- Changes to `version.json` file only

**Jobs:**
1. **read-version**: Reads version from `version.json`
2. **publish-nuget**: Publishes to NuGet.org
3. **publish-npm**: Publishes to npmjs.com
4. **publish-pypi**: Publishes to PyPI.org
5. **create-release**: Creates GitHub release with links to all packages

**Status:** Only runs when version is updated

## Version Management

### Centralized Version File

All package versions are managed through `version.json`:

```json
{
  "library_version": "0.1.0",
  "ton_spec_version": "1.0",
  "description": "Centralized version file for all DevPossible.Ton packages. library_version is for the package, ton_spec_version is for the TON file format specification."
}
```

**Important**: There are two separate versions:
- **`library_version`**: Version of the DevPossible.Ton library implementation (starts at 0.1.0)
- **`ton_spec_version`**: Version of the TON file format specification (currently 1.0 - stable)

The library implementation is in early development (0.x.x), while the TON file format itself is stable at 1.0.

### Version Formats

- **C# (.NET)**: `0.1.0` (uses SemVer with pre-release tags)
- **JavaScript (npm)**: `0.1.0` (uses SemVer with pre-release tags)
- **Python (PyPI)**: `0.1.0` (converts `-alpha` to `a0`, `-beta` to `b0`)

Note: The library starts at version 0.1.0 indicating it's in initial development. Version 1.0.0 will be released when the library is considered production-ready.

### Version Update Script

Use the PowerShell script to update all package versions at once:

```powershell
# Update version only
.\update-version.ps1 -Version "0.2.0"

# Update and commit
.\update-version.ps1 -Version "0.2.0" -Commit
```

**What the script does:**
1. Updates `library_version` in `version.json` (preserves `ton_spec_version`)
2. Updates `src/CSharp/DevPossible.Ton/DevPossible.Ton.csproj`
3. Updates `src/JavaScript/devpossible-ton/package.json`
4. Updates `src/Python/devpossible_ton/setup.py`
5. Optionally commits the changes

## Publishing a New Version

### Method 1: Using the Update Script (Recommended)

```powershell
# 1. Update the version
.\update-version.ps1 -Version "0.2.0"

# 2. Review the changes
git diff

# 3. Commit and push
git add version.json src/
git commit -m "Release version 0.2.0"
git push origin main
```

### Method 2: Manual Update

1. Edit `version.json` and update the `library_version` field
2. Commit and push to `main`:
   ```bash
   git add version.json
   git commit -m "Release version 0.2.0"
   git push origin main
   ```

The publish workflow will automatically:
- Read the new version from `version.json`
- Build and test all packages
- Publish to NuGet, npm, and PyPI
- Create a GitHub release

## Required GitHub Secrets

Before the publish workflow can run, configure these secrets in GitHub:

### NuGet Publishing
- **`NUGET_API_KEY`**: API key from nuget.org
  - Get from: https://www.nuget.org/account/apikeys
  - Scope: Push new packages and package versions

### npm Publishing  
- **`NPM_TOKEN`**: Authentication token from npmjs.com
  - Get from: https://www.npmjs.com/settings/[username]/tokens
  - Type: Automation token

### PyPI Publishing
- **`PYPI_API_TOKEN`**: API token from pypi.org
  - Get from: https://pypi.org/manage/account/token/
  - Scope: Entire account or specific project

### How to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name shown above

## Version Numbering Guidelines

### Development Phase (0.x.x)
- **Initial Release**: `0.1.0`
- **Feature Additions**: `0.2.0`, `0.3.0`, etc. (new features)
- **Bug Fixes**: `0.1.1`, `0.1.2` (patches during development)
- **Pre-release**: `0.5.0-alpha`, `0.9.0-beta` (testing before 1.0)

### Stable Releases (1.x.x and beyond)
- **First Stable**: `1.0.0` (production-ready)
- **Patch**: `1.0.1` (bug fixes)
- **Minor**: `1.1.0` (new features, backward compatible)
- **Major**: `2.0.0` (breaking changes)

### Recommended Workflow

1. **Development**: Work on `dev` branch (0.x.x versions)
2. **Testing**: Builds run automatically on commits
3. **Feature Releases**: Increment minor version (0.1.0 → 0.2.0)
4. **Bug Fixes**: Increment patch version (0.1.0 → 0.1.1)
5. **Pre-1.0 Testing**: Use `-alpha` or `-beta` tags (0.9.0-beta)
6. **Stable Release**: Update to `1.0.0` when production-ready

## Monitoring Releases

### Check Workflow Status
- GitHub Actions tab: https://github.com/DevPossible/DevPossible.Ton/actions

### Verify Package Publication
- **NuGet**: https://www.nuget.org/packages/DevPossible.Ton/
- **npm**: https://www.npmjs.com/package/@devpossible/ton
- **PyPI**: https://pypi.org/project/devpossible-ton/

### GitHub Releases
- Automatically created with links to all three package repositories
- Tagged with version number (e.g., `v0.1.0`)
- Marked as pre-release if version is `0.x.x` or contains `alpha`/`beta`

## Troubleshooting

### Build Fails
- Check the GitHub Actions logs
- Ensure all tests pass locally before pushing
- Verify dependencies are up to date

### Publish Fails
- **NuGet**: Check if version already exists (cannot republish)
- **npm**: Verify NPM_TOKEN is valid and has correct permissions
- **PyPI**: Check PYPI_API_TOKEN and ensure version doesn't exist

### Version Mismatch
- Run `update-version.ps1` to sync all package files
- Check that `version.json` is committed
- Verify all package files were updated correctly

### Secrets Not Working
- Ensure secrets are named exactly as specified
- Check token/key hasn't expired
- Verify scope/permissions are correct

## Best Practices

1. **Always use the update script** to ensure version consistency
2. **Test thoroughly** before releasing to `main`
3. **Use pre-release versions** for alpha/beta releases
4. **Document changes** in release notes
5. **Monitor the Actions tab** after pushing to `main`
6. **Never manually publish** packages (let CI/CD handle it)

## Package-Specific Notes

### C# / .NET (NuGet)
- Supports pre-release tags natively
- Uses `PackageVersion` property for versioning
- Includes all tests in the publish workflow

### JavaScript (npm)
- Package is scoped: `@devpossible/ton`
- Published with `--access public` flag
- Version updated via `npm version` command

### Python (PyPI)
- Pre-release format converted automatically (`-alpha` → `a0`)
- Uses `build` and `twine` for publishing
- Tested against Python 3.8 through 3.12

## Future Enhancements

Potential improvements to the CI/CD pipeline:

- [ ] Add code coverage reporting
- [ ] Implement semantic versioning automation
- [ ] Add deployment to test repositories (Test PyPI, npm beta)
- [ ] Automated changelog generation
- [ ] Slack/Discord notifications for releases
- [ ] Docker image publishing

---

**© 2024 DevPossible, LLC. All rights reserved.**

For questions or issues with the CI/CD pipeline, contact: support@devpossible.com
