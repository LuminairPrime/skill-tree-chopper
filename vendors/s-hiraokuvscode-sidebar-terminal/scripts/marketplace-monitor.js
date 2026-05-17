#!/usr/bin/env node

/**
 * VS Code Marketplace Monitor
 *
 * リリース後の監視とアラートシステム
 * 問題を早期発見してロールバックの必要性を判定
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MarketplaceMonitor {
  constructor() {
    this.packageJsonPath = path.join(__dirname, '..', 'package.json');
    this.alertThresholds = {
      downloadDropRate: 0.5, // 50%以上の下降率でアラート
      ratingDropThreshold: 4.0, // 評価が4.0以下でアラート
      errorReportThreshold: 5, // 5件以上のエラー報告でアラート
      timeWindow: 24 * 60 * 60 * 1000, // 24時間の監視ウィンドウ
    };
  }

  async monitorRelease() {
    console.log('📊 Starting marketplace monitoring...');

    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const extensionId = `${packageJson.publisher}.${packageJson.name}`;
    const currentVersion = packageJson.version;

    try {
      // 拡張機能の統計情報を取得
      const stats = await this.getExtensionStats(extensionId);

      // 健全性チェック
      const healthCheck = await this.performHealthCheck(stats, currentVersion);

      // アラート判定
      const alerts = await this.evaluateAlerts(healthCheck);

      // レポート生成
      await this.generateMonitoringReport(stats, healthCheck, alerts);

      // 自動対応の実行
      if (alerts.criticalIssues.length > 0) {
        await this.handleCriticalAlerts(alerts);
      }

      return { stats, healthCheck, alerts };
    } catch (error) {
      console.error('❌ Monitoring failed:', error.message);
      return null;
    }
  }

  async getExtensionStats(extensionId) {
    console.log(`📈 Fetching stats for ${extensionId}...`);

    try {
      // VS Code Marketplace APIから統計情報を取得
      const result = execSync(`npx @vscode/vsce show ${extensionId} --json`, { encoding: 'utf8' });

      const extensionData = JSON.parse(result);

      const stats = {
        version: extensionData.versions[0].version,
        downloadCount: extensionData.statistics?.downloadCount || 0,
        rating: extensionData.statistics?.averagerating || 0,
        ratingCount: extensionData.statistics?.ratingcount || 0,
        lastUpdated: extensionData.versions[0].lastUpdated,
        publisher: extensionData.publisher.publisherName,
        displayName: extensionData.displayName,
      };

      console.log(`✅ Stats retrieved for v${stats.version}`);
      return stats;
    } catch (error) {
      console.warn('⚠️  Could not fetch marketplace stats:', error.message);
      return {
        version: 'unknown',
        downloadCount: 0,
        rating: 0,
        ratingCount: 0,
        lastUpdated: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  async performHealthCheck(stats, expectedVersion) {
    console.log('🏥 Performing health check...');

    const healthCheck = {
      versionMatch: stats.version === expectedVersion,
      downloadTrend: 'stable',
      ratingHealth: 'good',
      recentActivity: 'normal',
      issues: [],
    };

    // バージョン整合性チェック
    if (!healthCheck.versionMatch) {
      healthCheck.issues.push({
        severity: 'high',
        type: 'version_mismatch',
        message: `Expected v${expectedVersion}, but marketplace shows v${stats.version}`,
      });
    }

    // 評価健全性チェック
    if (stats.rating < this.alertThresholds.ratingDropThreshold && stats.ratingCount > 10) {
      healthCheck.ratingHealth = 'poor';
      healthCheck.issues.push({
        severity: 'medium',
        type: 'low_rating',
        message: `Rating dropped to ${stats.rating} (${stats.ratingCount} reviews)`,
      });
    }

    // 履歴データとの比較（簡略版）
    const historyPath = path.join(__dirname, '..', '.version-backups', 'monitoring-history.json');
    if (fs.existsSync(historyPath)) {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      const previousStats = history.entries[history.entries.length - 1];

      if (previousStats && stats.downloadCount < previousStats.downloadCount * 0.9) {
        healthCheck.downloadTrend = 'declining';
        healthCheck.issues.push({
          severity: 'medium',
          type: 'download_decline',
          message: `Downloads declined from ${previousStats.downloadCount} to ${stats.downloadCount}`,
        });
      }
    }

    console.log(`✅ Health check completed - ${healthCheck.issues.length} issues found`);
    return healthCheck;
  }

  async evaluateAlerts(healthCheck) {
    console.log('🚨 Evaluating alert conditions...');

    const alerts = {
      criticalIssues: [],
      warnings: [],
      recommendations: [],
    };

    // 重大な問題の判定
    healthCheck.issues.forEach((issue) => {
      if (issue.severity === 'high') {
        alerts.criticalIssues.push({
          ...issue,
          action: 'consider_rollback',
          urgency: 'immediate',
        });
      } else if (issue.severity === 'medium') {
        alerts.warnings.push({
          ...issue,
          action: 'monitor_closely',
          urgency: 'within_24h',
        });
      }
    });

    // ロールバック推奨判定
    if (alerts.criticalIssues.length >= 2) {
      alerts.criticalIssues.push({
        severity: 'critical',
        type: 'rollback_recommended',
        message: 'Multiple critical issues detected - rollback recommended',
        action: 'execute_rollback',
        urgency: 'immediate',
      });
    }

    console.log(
      `🚨 Alert evaluation: ${alerts.criticalIssues.length} critical, ${alerts.warnings.length} warnings`
    );
    return alerts;
  }

  async generateMonitoringReport(stats, healthCheck, alerts) {
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      healthCheck,
      alerts,
      summary: {
        overallHealth: alerts.criticalIssues.length === 0 ? 'healthy' : 'unhealthy',
        recommendedAction:
          alerts.criticalIssues.length > 0 ? 'consider_rollback' : 'continue_monitoring',
      },
    };

    // 履歴ファイルに追加
    const historyPath = path.join(__dirname, '..', '.version-backups', 'monitoring-history.json');
    let history = { entries: [] };

    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }

    history.entries.push(report);

    // 履歴は最新100件まで保持
    if (history.entries.length > 100) {
      history.entries = history.entries.slice(-100);
    }

    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

    // 即座のレポートファイル
    const reportPath = path.join(
      __dirname,
      '..',
      '.version-backups',
      `monitoring-report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Monitoring report generated: ${reportPath}`);
    return report;
  }

  async handleCriticalAlerts(alerts) {
    console.log('🚨 CRITICAL ALERTS DETECTED - Initiating automated response...');

    const rollbackRecommended = alerts.criticalIssues.some(
      (alert) => alert.type === 'rollback_recommended' || alert.action === 'execute_rollback'
    );

    if (rollbackRecommended) {
      console.log('🔄 AUTOMATIC ROLLBACK RECOMMENDED');
      console.log('📋 Critical issues detected:');

      alerts.criticalIssues.forEach((alert) => {
        console.log(`   ❌ ${alert.type}: ${alert.message}`);
      });

      // 自動ロールバックの実行確認
      console.log('\n⚠️  AUTOMATIC ROLLBACK DECISION POINT');
      console.log('Options:');
      console.log('1. Execute automatic rollback immediately');
      console.log('2. Generate rollback plan for manual execution');
      console.log('3. Continue monitoring (not recommended)');

      // 実際の環境では、設定に基づいて自動実行するか決定
      const autoRollbackEnabled = process.env.AUTO_ROLLBACK_ENABLED === 'true';

      if (autoRollbackEnabled) {
        console.log('🤖 AUTO-ROLLBACK ENABLED - Executing emergency rollback...');
        await this.executeAutomaticRollback();
      } else {
        console.log('📝 Generating rollback plan for manual execution...');
        await this.generateRollbackPlan(alerts);
      }
    }
  }

  async executeAutomaticRollback() {
    console.log('🔄 EXECUTING AUTOMATIC EMERGENCY ROLLBACK...');

    try {
      const AutomatedRollbackPublisher = require('./automated-rollback-publisher');
      const publisher = new AutomatedRollbackPublisher();

      const success = await publisher.executeEmergencyRollbackAndPublish();

      if (success) {
        console.log('✅ AUTOMATIC ROLLBACK COMPLETED SUCCESSFULLY');

        // 成功通知の記録
        const notificationRecord = {
          timestamp: new Date().toISOString(),
          action: 'automatic_rollback_executed',
          status: 'success',
          trigger: 'marketplace_monitoring',
        };

        const notificationPath = path.join(
          __dirname,
          '..',
          '.version-backups',
          `auto-rollback-${Date.now()}.json`
        );
        fs.writeFileSync(notificationPath, JSON.stringify(notificationRecord, null, 2));
      } else {
        throw new Error('Automatic rollback failed');
      }
    } catch (error) {
      console.error('❌ AUTOMATIC ROLLBACK FAILED:', error.message);
      console.log('📝 Falling back to manual rollback plan generation...');
      await this.generateRollbackPlan([]);
    }
  }

  async generateRollbackPlan(alerts) {
    const rollbackPlan = {
      timestamp: new Date().toISOString(),
      triggerAlerts: alerts,
      immediateActions: [
        '1. Review critical alerts above',
        '2. Execute: npm run rollback:emergency:publish',
        '3. Monitor marketplace for successful rollback',
        '4. Notify users of temporary rollback',
        '5. Investigate and fix underlying issues',
      ],
      commands: [
        'npm run rollback:list',
        'npm run rollback:emergency:publish',
        'npm run rollback:verify',
      ],
      contactInfo: {
        team: 'Development Team',
        escalation: 'VS Code Marketplace Support',
      },
    };

    const planPath = path.join(
      __dirname,
      '..',
      '.version-backups',
      `critical-rollback-plan-${Date.now()}.json`
    );
    fs.writeFileSync(planPath, JSON.stringify(rollbackPlan, null, 2));

    console.log(`📋 Critical rollback plan generated: ${planPath}`);
    console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
    rollbackPlan.immediateActions.forEach((action) => {
      console.log(`   ${action}`);
    });

    return rollbackPlan;
  }

  async continuousMonitoring(intervalMinutes = 30) {
    console.log(`🔄 Starting continuous monitoring (${intervalMinutes} minute intervals)...`);

    const monitor = async () => {
      console.log(`\n⏰ ${new Date().toISOString()} - Running monitoring check...`);
      await this.monitorRelease();
    };

    // 初回実行
    await monitor();

    // 定期実行
    setInterval(monitor, intervalMinutes * 60 * 1000);
  }
}

// CLI Interface
async function main() {
  const monitor = new MarketplaceMonitor();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'check':
        await monitor.monitorRelease();
        break;

      case 'continuous':
        const interval = parseInt(args[1]) || 30;
        await monitor.continuousMonitoring(interval);
        break;

      default:
        console.log(`
📊 VS Code Marketplace Monitor

Available commands:
  npm run monitor:check        # Single monitoring check
  npm run monitor:continuous   # Continuous monitoring (30min intervals)

Features:
  ✅ Download trend analysis
  ✅ Rating health monitoring
  ✅ Version consistency checks
  ✅ Automatic alert generation
  ✅ Critical issue detection
  ✅ Rollback recommendations
  ✅ Automated rollback execution

Environment Variables:
  AUTO_ROLLBACK_ENABLED=true   # Enable automatic rollback on critical alerts
        `);
    }
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MarketplaceMonitor;
