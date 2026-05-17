'use strict';
/**
 * ターミナル検証サービス
 *
 * ターミナル操作の検証とリカバリロジックを専門に扱います。
 * 作成・削除・操作の妥当性チェックとエラーリカバリを担当します。
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalValidationService = void 0;
const logger_1 = require('../utils/logger');
const OperationResultHandler_1 = require('../utils/OperationResultHandler');
const TerminalNumberManager_1 = require('../utils/TerminalNumberManager');
const common_1 = require('../utils/common');
const SystemConstants_1 = require('../constants/SystemConstants');
/**
 * ターミナル検証サービス実装
 */
class TerminalValidationService {
  constructor(config = {}) {
    const terminalConfig = (0, common_1.getTerminalConfig)();
    this.config = {
      maxTerminals:
        terminalConfig.maxTerminals || SystemConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT,
      minTerminals: 1,
      maxDataSize: 10 * 1024 * 1024, // 10MB
      maxDimensions: { cols: 500, rows: 200 },
      minDimensions: { cols: 1, rows: 1 },
      allowForceDelete: true,
      ...config,
    };
    this._terminalNumberManager = new TerminalNumberManager_1.TerminalNumberManager(
      this.config.maxTerminals
    );
    (0, logger_1.terminal)(`🛡️ [VALIDATION] Terminal validation service initialized`);
  }
  /**
   * ターミナル作成の検証
   */
  validateCreation(terminals) {
    // 最大数チェック
    if (terminals.size >= this.config.maxTerminals) {
      const message = `Cannot create terminal: maximum limit reached (${this.config.maxTerminals})`;
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    // 利用可能な番号があるか確認
    const canCreate = this._terminalNumberManager.canCreate(terminals);
    if (!canCreate) {
      const message = 'No available terminal slots';
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    (0, logger_1.terminal)(`✅ [VALIDATION] Terminal creation validated`);
    return OperationResultHandler_1.OperationResultHandler.success();
  }
  /**
   * ターミナル削除の検証
   */
  validateDeletion(terminalId, terminals, force = false) {
    // ターミナルIDの検証
    const idValidation = this.validateTerminalId(terminalId);
    if (!idValidation.success) {
      return idValidation;
    }
    // ターミナルの存在確認
    if (!terminals.has(terminalId)) {
      const message = `Terminal not found: ${terminalId}`;
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    // forceオプションがない場合は最小数チェック
    if (!force && terminals.size <= this.config.minTerminals) {
      const message = `Must keep at least ${this.config.minTerminals} terminal(s) open`;
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    (0, logger_1.terminal)(`✅ [VALIDATION] Terminal deletion validated for: ${terminalId}`);
    return OperationResultHandler_1.OperationResultHandler.success();
  }
  /**
   * ターミナル操作の検証
   */
  validateOperation(terminalId, terminals, operation) {
    // ターミナルIDの検証
    const idValidation = this.validateTerminalId(terminalId);
    if (!idValidation.success) {
      return idValidation;
    }
    // ターミナルの存在確認
    if (!terminals.has(terminalId)) {
      const message = `Terminal not found for operation '${operation}': ${terminalId}`;
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    // ターミナルの整合性チェック
    const terminal = terminals.get(terminalId);
    if (terminal) {
      const integrity = this.checkTerminalIntegrity(terminal);
      if (!integrity.isValid) {
        const message = `Terminal integrity check failed for operation '${operation}': ${integrity.issues.join(', ')}`;
        (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
        return OperationResultHandler_1.OperationResultHandler.failure(message);
      }
    }
    (0, logger_1.terminal)(
      `✅ [VALIDATION] Operation '${operation}' validated for terminal: ${terminalId}`
    );
    return OperationResultHandler_1.OperationResultHandler.success();
  }
  /**
   * ターミナルIDの検証
   */
  validateTerminalId(terminalId) {
    if (!terminalId || typeof terminalId !== 'string') {
      const message = 'Invalid terminal ID: must be a non-empty string';
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    if (terminalId.trim() === '') {
      const message = 'Invalid terminal ID: cannot be empty';
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    return OperationResultHandler_1.OperationResultHandler.success();
  }
  /**
   * ターミナルデータの検証
   */
  validateTerminalData(terminalId, data) {
    // データサイズチェック
    if (data.length > this.config.maxDataSize) {
      const message = `Data size exceeds maximum allowed (${this.config.maxDataSize} bytes)`;
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message} for terminal: ${terminalId}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    // データ型チェック
    if (typeof data !== 'string') {
      const message = 'Invalid data type: must be a string';
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    return OperationResultHandler_1.OperationResultHandler.success();
  }
  /**
   * リサイズパラメータの検証
   */
  validateResizeParams(cols, rows) {
    // 最小寸法チェック
    if (cols < this.config.minDimensions.cols || rows < this.config.minDimensions.rows) {
      const message = `Dimensions too small: ${cols}x${rows} (min: ${this.config.minDimensions.cols}x${this.config.minDimensions.rows})`;
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    // 最大寸法チェック
    if (cols > this.config.maxDimensions.cols || rows > this.config.maxDimensions.rows) {
      const message = `Dimensions too large: ${cols}x${rows} (max: ${this.config.maxDimensions.cols}x${this.config.maxDimensions.rows})`;
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    // 数値チェック
    if (!Number.isInteger(cols) || !Number.isInteger(rows)) {
      const message = `Dimensions must be integers: ${cols}x${rows}`;
      (0, logger_1.terminal)(`⚠️ [VALIDATION] ${message}`);
      return OperationResultHandler_1.OperationResultHandler.failure(message);
    }
    return OperationResultHandler_1.OperationResultHandler.success();
  }
  /**
   * ターミナルの整合性チェック
   */
  checkTerminalIntegrity(terminal) {
    const issues = [];
    const warnings = [];
    // 必須フィールドの確認
    if (!terminal.id) {
      issues.push('Missing terminal ID');
    }
    if (!terminal.name) {
      issues.push('Missing terminal name');
    }
    if (terminal.number === undefined || terminal.number === null) {
      issues.push('Missing terminal number');
    }
    // PTYインスタンスの確認
    if (!terminal.pty && !terminal.ptyProcess) {
      issues.push('No PTY instance available');
    }
    // PTYの型確認
    if (terminal.pty && typeof terminal.pty !== 'object') {
      issues.push('Invalid PTY instance type');
    }
    if (terminal.ptyProcess && typeof terminal.ptyProcess !== 'object') {
      issues.push('Invalid PTY process instance type');
    }
    // 警告レベルのチェック
    if (!terminal.createdAt) {
      warnings.push('Missing creation timestamp');
    }
    if (terminal.isActive === undefined) {
      warnings.push('Missing isActive flag');
    }
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
    };
  }
  /**
   * ターミナルマップ全体の健全性チェック
   */
  validateTerminalMapHealth(terminals) {
    const issues = [];
    const warnings = [];
    // ターミナル数チェック
    if (terminals.size > this.config.maxTerminals) {
      issues.push(`Too many terminals: ${terminals.size}/${this.config.maxTerminals}`);
    }
    // 重複IDチェック
    const ids = new Set();
    const duplicateIds = [];
    terminals.forEach((_, id) => {
      if (ids.has(id)) {
        duplicateIds.push(id);
      }
      ids.add(id);
    });
    if (duplicateIds.length > 0) {
      issues.push(`Duplicate terminal IDs: ${duplicateIds.join(', ')}`);
    }
    // 重複番号チェック
    const numbers = new Map();
    terminals.forEach((terminal, id) => {
      if (terminal.number !== undefined && terminal.number !== null) {
        const existing = numbers.get(terminal.number) || [];
        existing.push(id);
        numbers.set(terminal.number, existing);
      }
    });
    numbers.forEach((terminalIds, number) => {
      if (terminalIds.length > 1) {
        warnings.push(`Duplicate terminal number ${number}: ${terminalIds.join(', ')}`);
      }
    });
    // 各ターミナルの整合性チェック
    terminals.forEach((terminal, id) => {
      const integrity = this.checkTerminalIntegrity(terminal);
      if (!integrity.isValid) {
        issues.push(`Terminal ${id} integrity issues: ${integrity.issues.join(', ')}`);
      }
      if (integrity.warnings.length > 0) {
        warnings.push(`Terminal ${id} warnings: ${integrity.warnings.join(', ')}`);
      }
    });
    // 健全性の判定
    const isHealthy = issues.length === 0;
    if (!isHealthy) {
      (0, logger_1.terminal)(
        `⚠️ [VALIDATION] Terminal map health check failed: ${issues.length} issues`
      );
    } else if (warnings.length > 0) {
      (0, logger_1.terminal)(`⚠️ [VALIDATION] Terminal map has ${warnings.length} warnings`);
    } else {
      (0, logger_1.terminal)(`✅ [VALIDATION] Terminal map health check passed`);
    }
    return {
      isHealthy,
      issues,
      warnings,
    };
  }
}
exports.TerminalValidationService = TerminalValidationService;
//# sourceMappingURL=TerminalValidationService.js.map
