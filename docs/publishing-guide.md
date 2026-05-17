# Publishing Guide for AI Skill Auditor

This guide outlines the standard procedures for packaging, distributing, and publishing the AI Skill Auditor extension.

## 1. Automated Publishing (Single Source of Truth)

We use a GitHub Actions CI/CD pipeline (`.github/workflows/publish.yml`) to automatically publish the extension to **both** the Microsoft VS Code Marketplace and the Open VSX Registry simultaneously.

**Do not publish directly from your local machine using `vsce publish`.** Doing so will skip the Open VSX Registry deployment and create version mismatches.

### How to Release a New Version

We have configured `mise` tasks to safely handle version bumping and triggering the CI pipeline. Ensure your working directory is clean, and then run one of the following commands depending on the scale of your changes:

```bash
# For bug fixes (e.g., 1.0.0 -> 1.0.1)
mise run release:patch
# (Or simply `mise run release`)

# For new features (e.g., 1.0.0 -> 1.1.0)
mise run release:minor

# For breaking changes (e.g., 1.0.0 -> 2.0.0)
mise run release:major
```

**What these tasks do under the hood:**

1. Verify the git working directory is clean.
2. Run linters, unit tests, and compile the build.
3. Automatically update `package.json` with the new version.
4. Create a new git commit and a version tag (e.g., `v1.0.1`).
5. Push the commit and the tag to GitHub (`git push --follow-tags`).
6. The push triggers the GitHub Action, which handles building and uploading to both marketplaces using repository secrets.

## 2. Local Packaging (For Testing & Verification)

Creating a `.vsix` file locally allows you to distribute the extension directly (e.g., to team members or for local testing) without going through a marketplace.

1. **Build the package:**
   ```bash
   mise run package
   ```
   This generates a file like `skill-tree-chopper.vsix` in the `releases/` directory.
2. **Install locally:**
   You can install it in VS Code by opening the Extensions view, clicking the `...` menu, and selecting **"Install from VSIX..."**.

## 3. Distributing via GitHub Releases (Optional)

For open-source projects or beta distributions, GitHub Releases is a great place to host your `.vsix` binaries alongside the automated marketplace deployments.

1. Wait for the `mise run release` command to push the new git tag.
2. Go to the new tag on GitHub and click **Create Release**.
3. Add your changelog/release notes.
4. If needed, attach the locally built `.vsix` from `mise run package` to the **Attached binaries** section of the release form.
5. Publish the release.
