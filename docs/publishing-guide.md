# Publishing Guide for AI Skill Auditor

This guide outlines the standard procedures for packaging, distributing, and publishing the AI Skill Auditor extension.

## 1. Local Packaging (The `.vsix` file)

Creating a `.vsix` file allows you to distribute the extension directly (e.g., to team members or for local testing) without going through a marketplace.

1. **Install the packaging tool:**
   ```bash
   npm install -g @vscode/vsce
   ```
2. **Build the package:**
   Ensure your `package.json` contains a valid `publisher`, `name`, `version`, `icon` (128x128), and that your `README.md` is updated. Then run:
   ```bash
   vsce package
   ```
3. **Install locally:**
   This generates a file like `ai-skill-auditor-1.0.0.vsix`. You can install it in VS Code by opening the Extensions view, clicking the `...` menu, and selecting **"Install from VSIX..."**.

## 2. Distributing via GitHub Releases

For open-source projects or beta distributions, GitHub Releases is a great place to host your `.vsix` binaries.

1. Create a new Release in your GitHub repository and tag the version (e.g., `v1.0.0`).
2. Add your changelog/release notes.
3. Drag and drop the generated `ai-skill-auditor-1.0.0.vsix` file into the **Attached binaries** section of the release form.
4. Publish the release.

## 3. Publishing to the VS Code Marketplace

To make the extension searchable directly within the VS Code Extension tab:

1. **Create an Azure DevOps Organization:** The Visual Studio Marketplace authenticates publishers via Azure DevOps.
2. **Generate a Personal Access Token (PAT):**
   - Create a PAT in Azure DevOps.
   - Set scopes to include `Marketplace (Manage)`.
3. **Create a Publisher Profile:**
   - Go to the [Visual Studio Marketplace Management Page](https://marketplace.visualstudio.com/manage) and create a publisher profile.
   - **Important:** The publisher ID here must exactly match the `"publisher"` field in your `package.json`.
4. **Login via CLI:**
   ```bash
   vsce login <your-publisher-name>
   ```
   *(When prompted, paste your Personal Access Token).*
5. **Publish the Extension:**
   ```bash
   vsce publish
   ```
   
After publishing, the extension will undergo a virus scan and will be publicly available in the VS Code Marketplace shortly after.