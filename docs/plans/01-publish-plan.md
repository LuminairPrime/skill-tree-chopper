# Open VSX & Microsoft Marketplace Publishing Plan

This plan details how to automate the publishing of the `skill-tree-chopper` extension to both the Open VSX Registry (the open-source registry used by VSCodium) and the Microsoft VS Code Marketplace in parallel.

## Phase 1: Account Setup & Authentication

### 1. Open VSX Registry

1. Go to [Open VSX Registry (open-vsx.org)](https://open-vsx.org/).
2. Log in using your GitHub account.
3. Your extension uses the publisher `LuminairPrime`. Navigate to your settings and **create the namespace** `LuminairPrime` if you haven't already. (You may need to verify ownership via their process).
4. Go to **Access Tokens** in your Open VSX settings and generate a new Personal Access Token.
5. In your GitHub Repository, go to **Settings > Secrets and variables > Actions**.
6. Create a new repository secret named `OVSX_PAT` with this token.

### 2. Microsoft VS Code Marketplace (Optional but recommended for parallel publishing)

1. Go to the [Azure DevOps portal](https://dev.azure.com/) and ensure you have an organization.
2. Generate a Personal Access Token (PAT) with `Marketplace (Manage)` scopes.
3. In your GitHub Repository, go to **Settings > Secrets and variables > Actions**.
4. Create a new repository secret named `VSCE_PAT` with this token.

## Phase 2: Create the Continuous Deployment Workflow

We will create a new GitHub Actions workflow file: `.github/workflows/publish.yml` (or `release.yml`).

### Trigger Options

We will set up the workflow to trigger:

- **Automatically:** Whenever a new version tag (e.g., `v1.1.0`) is pushed to the repository.
- **Manually:** Via the GitHub Actions UI (`workflow_dispatch`).

### Workflow Steps

1. **Checkout Code:** Use `actions/checkout`.
2. **Setup Node:** Use `actions/setup-node`.
3. **Install Dependencies:** `npm ci`.
4. **Compile/Build:** `npm run compile`.
5. **Publish to Microsoft Marketplace (using `vsce`):**
   ```yaml
   - name: Publish to VS Code Marketplace
     run: npx vsce publish --pat ${{ secrets.VSCE_PAT }}
   ```
6. **Publish to Open VSX (using `EclipseFdn/publish-extensions`):**
   ```yaml
   - name: Publish to Open VSX
     uses: EclipseFdn/publish-extensions@v1
     with:
       OVSX_PAT: ${{ secrets.OVSX_PAT }}
       # Optional: define registry if using a private one, but default is open-vsx.org
   ```

## Phase 3: Developer Workflow (How to Release)

When you are ready to publish a new version:

1. Update the version in `package.json` (e.g., `1.1.0`) and commit it.
2. Create a git tag for the release:
   `git tag v1.1.0`
3. Push the tag to GitHub:
   `git push origin v1.1.0`
4. The GitHub Action will trigger, build the extension, and publish it to both registries simultaneously!

## Next Steps

If you approve of this plan, I can automatically create the `.github/workflows/publish.yml` workflow file for you right now. You will just need to handle Phase 1 manually (creating the tokens on the respective websites).
