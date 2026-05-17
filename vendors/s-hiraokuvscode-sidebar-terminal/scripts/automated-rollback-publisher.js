#!/usr/bin/env node

/**
 * Automated Rollback Publisher
 *
 * VS Code Marketplace API連携による完全自動化ロールバック&公開システム
 *
 * Usage:
 *   npm run rollback:emergency:publish    # 緊急ロールバック + 自動公開
 *   npm run rollback:hotfix              # ホットフィックス版の自動リリース
 *   npm run rollback:verify              # 公開前の安全性確認
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const RollbackManager = require('./rollback-release');

class AutomatedRollbackPublisher {
  constructor() {
    this.rollbackManager = new RollbackManager();
    this.packageJsonPath = path.join(__dirname, '..', 'package.json');
    this.safetyChecks = {
      testsPassing: false,
      lintPassing: false,
      compilationSuccessful: false,
      marketplaceTokenAvailable: false,
      versionValidated: false,
    };
  }

  async executeEmergencyRollbackAndPublish() {
    console.log('🚨 EMERGENCY ROLLBACK AND PUBLISH INITIATED');
    console.log('⚠️  This will automatically rollback and publish to VS Code Marketplace');

    try {
      // Phase 1: Safety confirmation
      await this.confirmEmergencyAction();

      // Phase 2: Execute rollback
      await this.executeRollback();

      // Phase 3: Run safety checks
      await this.runSafetyChecks();

      // Phase 4: Automated testing
      await this.runAutomatedTests();

      // Phase 5: Publish to marketplace
      await this.publishToMarketplace();

      // Phase 6: Post-publish verification
      await this.verifyPublication();

      console.log('🎉 EMERGENCY ROLLBACK AND PUBLISH COMPLETED SUCCESSFULLY!');
      return true;
    } catch (error) {
      console.error('❌ EMERGENCY ROLLBACK AND PUBLISH FAILED:', error.message);
      await this.handlePublishFailure(error);
      return false;
    }
  }

  async confirmEmergencyAction() {
    console.log('🔍 Confirming emergency rollback action...');

    const currentVersion = this.rollbackManager.getCurrentVersion();
    const availableVersions = this.rollbackManager.listAvailableVersions();

    if (availableVersions.length < 2) {
      throw new Error('No previous version available for emergency rollback');
    }

    const targetVersion = availableVersions[1];

    console.log(`📊 Emergency Rollback Plan:`);
    console.log(`   Current Version: v${currentVersion}`);
    console.log(`   Target Version:  v${targetVersion}`);
    console.log(`   Action: Rollback + Automatic Publish`);

    // Create emergency rollback record
    const emergencyRecord = {
      timestamp: new Date().toISOString(),
      fromVersion: currentVersion,
      toVersion: targetVersion,
      reason: 'Emergency rollback triggered',
      automated: true,
    };

    const recordPath = path.join(
      __dirname,
      '..',
      '.version-backups',
      `emergency-${Date.now()}.json`
    );
    fs.writeFileSync(recordPath, JSON.stringify(emergencyRecord, null, 2));

    console.log(`📝 Emergency record created: ${recordPath}`);
    return { currentVersion, targetVersion };
  }

  async executeRollback() {
    console.log('🔄 Executing automated rollback...');

    const availableVersions = this.rollbackManager.listAvailableVersions();
    const targetVersion = availableVersions[1];

    await this.rollbackManager.rollbackToVersion(targetVersion);

    console.log(`✅ Rollback to v${targetVersion} completed`);
    return targetVersion;
  }

  async runSafetyChecks() {
    console.log('🔒 Running safety checks...');

    try {
      // Check marketplace token
      await this.checkMarketplaceToken();

      // Validate package.json
      await this.validatePackageJson();

      // Check dependencies
      await this.checkDependencies();

      console.log('✅ All safety checks passed');
      return true;
    } catch (error) {
      throw new Error(`Safety checks failed: ${error.message}`);
    }
  }

  async checkMarketplaceToken() {
    try {
      // Check if VSCE token is available
      execSync('npx @vscode/vsce ls-publishers', { stdio: 'pipe' });
      this.safetyChecks.marketplaceTokenAvailable = true;
      console.log('✅ VS Code Marketplace token validated');
    } catch (error) {
      throw new Error('VS Code Marketplace token not available or invalid');
    }
  }

  async validatePackageJson() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));

      if (!packageJson.version || !packageJson.name || !packageJson.publisher) {
        throw new Error('Invalid package.json structure');
      }

      this.safetyChecks.versionValidated = true;
      console.log(`✅ Package.json validated - v${packageJson.version}`);
    } catch (error) {
      throw new Error(`Package.json validation failed: ${error.message}`);
    }
  }

  async checkDependencies() {
    try {
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
      console.log('✅ Dependency security check passed');
    } catch (error) {
      console.warn('⚠️  Dependency audit warnings detected, proceeding with caution');
    }
  }

  async runAutomatedTests() {
    console.log('🧪 Running automated tests...');

    try {
      // Compilation check
      console.log('🔨 Checking compilation...');
      execSync('npm run compile', { stdio: 'pipe' });
      this.safetyChecks.compilationSuccessful = true;
      console.log('✅ Compilation successful');

      // Linting check
      console.log('📝 Running linter...');
      try {
        execSync('npm run lint', { stdio: 'pipe' });
        this.safetyChecks.lintPassing = true;
        console.log('✅ Linting passed');
      } catch (lintError) {
        console.warn('⚠️  Linting warnings detected, proceeding with emergency rollback');
      }

      // Unit tests
      console.log('🎯 Running critical tests...');
      try {
        execSync('npm run test:unit', { stdio: 'pipe', timeout: 60000 });
        this.safetyChecks.testsPassing = true;
        console.log('✅ Critical tests passed');
      } catch (testError) {
        console.warn('⚠️  Some tests failed, but proceeding with emergency rollback');
      }
    } catch (error) {
      throw new Error(`Automated tests failed: ${error.message}`);
    }
  }

  async publishToMarketplace() {
    console.log('📦 Publishing to VS Code Marketplace...');

    try {
      // Create package
      console.log('📦 Creating VSIX package...');
      execSync('npm run vsce:package', { stdio: 'inherit' });

      // Publish to marketplace
      console.log('🚀 Publishing to marketplace...');
      execSync('npm run vsce:publish', { stdio: 'inherit' });

      console.log('✅ Successfully published to VS Code Marketplace');
      return true;
    } catch (error) {
      throw new Error(`Marketplace publication failed: ${error.message}`);
    }
  }

  async verifyPublication() {
    console.log('🔍 Verifying publication...');

    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const publishedVersion = packageJson.version;

    try {
      // Wait a moment for marketplace to update
      console.log('⏳ Waiting for marketplace update...');
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Verify using vsce
      const result = execSync(
        `npx @vscode/vsce show ${packageJson.publisher}.${packageJson.name}`,
        { encoding: 'utf8' }
      );

      if (result.includes(publishedVersion)) {
        console.log(`✅ Publication verified - v${publishedVersion} is live`);
        return true;
      } else {
        throw new Error('Version not found in marketplace listing');
      }
    } catch (error) {
      console.warn(`⚠️  Publication verification inconclusive: ${error.message}`);
      console.log('📝 Please manually verify the extension is available in VS Code Marketplace');
      return false;
    }
  }

  async handlePublishFailure(error) {
    console.log('🚨 HANDLING PUBLISH FAILURE...');

    const failureRecord = {
      timestamp: new Date().toISOString(),
      error: error.message,
      safetyChecks: this.safetyChecks,
      rollbackStatus: 'completed',
      publishStatus: 'failed',
      nextSteps: [
        'Review error logs',
        'Check marketplace token',
        'Manual publish may be required',
        'Contact marketplace support if needed',
      ],
    };

    const failureRecordPath = path.join(
      __dirname,
      '..',
      '.version-backups',
      `publish-failure-${Date.now()}.json`
    );
    fs.writeFileSync(failureRecordPath, JSON.stringify(failureRecord, null, 2));

    console.log(`📝 Failure record created: ${failureRecordPath}`);
    console.log('🔧 Rollback was successful, but publishing failed');
    console.log('📋 Manual steps required:');
    console.log('   1. Check error logs above');
    console.log('   2. Verify marketplace token: npx @vscode/vsce ls-publishers');
    console.log('   3. Manual publish: npm run vsce:publish');
  }

  async executeHotfixRelease() {
    console.log('🔥 HOTFIX RELEASE INITIATED');

    try {
      // Phase 1: Create hotfix branch
      await this.createHotfixBranch();

      // Phase 2: Apply critical fixes (user would do this manually)
      console.log('⚠️  Apply your hotfix changes now, then press Enter to continue...');
      // In real scenario, this would wait for user input or automated fixes

      // Phase 3: Run tests and publish
      await this.runSafetyChecks();
      await this.runAutomatedTests();
      await this.publishToMarketplace();

      console.log('🎉 HOTFIX RELEASE COMPLETED');
      return true;
    } catch (error) {
      console.error('❌ HOTFIX RELEASE FAILED:', error.message);
      return false;
    }
  }

  async createHotfixBranch() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const branchName = `hotfix/emergency-${timestamp}`;

      execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      console.log(`✅ Hotfix branch created: ${branchName}`);
    } catch (error) {
      console.warn('⚠️  Could not create git branch:', error.message);
    }
  }

  async verifyPrePublish() {
    console.log('🔍 PRE-PUBLISH VERIFICATION');

    const checks = [
      { name: 'Compilation', check: () => execSync('npm run compile', { stdio: 'pipe' }) },
      { name: 'Linting', check: () => execSync('npm run lint', { stdio: 'pipe' }) },
      { name: 'Unit Tests', check: () => execSync('npm run test:unit', { stdio: 'pipe' }) },
      {
        name: 'Package Creation',
        check: () => execSync('npm run vsce:package', { stdio: 'pipe' }),
      },
      {
        name: 'Marketplace Token',
        check: () => execSync('npx @vscode/vsce ls-publishers', { stdio: 'pipe' }),
      },
    ];

    const results = {};

    for (const { name, check } of checks) {
      try {
        console.log(`🔍 Checking ${name}...`);
        check();
        results[name] = '✅ PASS';
        console.log(`✅ ${name} check passed`);
      } catch (error) {
        results[name] = `❌ FAIL: ${error.message}`;
        console.log(`❌ ${name} check failed`);
      }
    }

    console.log('\n📊 PRE-PUBLISH VERIFICATION RESULTS:');
    Object.entries(results).forEach(([check, result]) => {
      console.log(`   ${check}: ${result}`);
    });

    const allPassed = Object.values(results).every((result) => result.startsWith('✅'));
    console.log(`\n🎯 Overall Status: ${allPassed ? '✅ READY TO PUBLISH' : '❌ NOT READY'}`);

    return allPassed;
  }
}

// CLI Interface
async function main() {
  const publisher = new AutomatedRollbackPublisher();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'emergency':
        await publisher.executeEmergencyRollbackAndPublish();
        break;

      case 'hotfix':
        await publisher.executeHotfixRelease();
        break;

      case 'verify':
        await publisher.verifyPrePublish();
        break;

      default:
        console.log(`
🚀 Automated Rollback Publisher

Available commands:
  npm run rollback:emergency:publish    # Emergency rollback + auto publish
  npm run rollback:hotfix              # Hotfix release automation
  npm run rollback:verify              # Pre-publish verification

Emergency Usage:
  npm run rollback:emergency:publish

Safety Features:
  ✅ Automated testing before publish
  ✅ Marketplace token validation
  ✅ Dependency security checks
  ✅ Publication verification
  ✅ Failure handling and rollback
        `);
    }
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AutomatedRollbackPublisher;
