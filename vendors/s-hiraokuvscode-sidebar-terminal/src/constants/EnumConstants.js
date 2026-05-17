'use strict';
/**
 * 列挙型定数
 *
 * 型安全な定数グループを定義する列挙型
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConfigurationCategory =
  exports.ResourceType =
  exports.PerformanceMetric =
  exports.SessionOperation =
  exports.TerminalState =
  exports.CliAgentStatus =
  exports.NotificationType =
  exports.MessageSeverity =
  exports.TerminalAction =
  exports.SystemStatus =
    void 0;
/**
 * システム状態の列挙型
 */
var SystemStatus;
(function (SystemStatus) {
  SystemStatus['INITIALIZING'] = 'initializing';
  SystemStatus['READY'] = 'ready';
  SystemStatus['BUSY'] = 'busy';
  SystemStatus['ERROR'] = 'error';
  SystemStatus['DISPOSING'] = 'disposing';
  SystemStatus['DISPOSED'] = 'disposed';
})(SystemStatus || (exports.SystemStatus = SystemStatus = {}));
/**
 * ターミナル操作の種類
 */
var TerminalAction;
(function (TerminalAction) {
  TerminalAction['CREATE'] = 'create';
  TerminalAction['DELETE'] = 'delete';
  TerminalAction['ACTIVATE'] = 'activate';
  TerminalAction['RESIZE'] = 'resize';
  TerminalAction['CLEAR'] = 'clear';
  TerminalAction['SPLIT'] = 'split';
  TerminalAction['KILL'] = 'kill';
  TerminalAction['RESTART'] = 'restart';
})(TerminalAction || (exports.TerminalAction = TerminalAction = {}));
/**
 * メッセージの重要度レベル
 */
var MessageSeverity;
(function (MessageSeverity) {
  MessageSeverity['DEBUG'] = 'debug';
  MessageSeverity['INFO'] = 'info';
  MessageSeverity['WARNING'] = 'warning';
  MessageSeverity['ERROR'] = 'error';
  MessageSeverity['CRITICAL'] = 'critical';
})(MessageSeverity || (exports.MessageSeverity = MessageSeverity = {}));
/**
 * 通知の種類
 */
var NotificationType;
(function (NotificationType) {
  NotificationType['SUCCESS'] = 'success';
  NotificationType['INFO'] = 'info';
  NotificationType['WARNING'] = 'warning';
  NotificationType['ERROR'] = 'error';
})(NotificationType || (exports.NotificationType = NotificationType = {}));
/**
 * CLIエージェントの状態
 */
var CliAgentStatus;
(function (CliAgentStatus) {
  CliAgentStatus['INACTIVE'] = 'inactive';
  CliAgentStatus['DETECTING'] = 'detecting';
  CliAgentStatus['ACTIVE'] = 'active';
  CliAgentStatus['PROCESSING'] = 'processing';
  CliAgentStatus['IDLE'] = 'idle';
  CliAgentStatus['ERROR'] = 'error';
})(CliAgentStatus || (exports.CliAgentStatus = CliAgentStatus = {}));
/**
 * ターミナルの状態
 */
var TerminalState;
(function (TerminalState) {
  TerminalState['CREATING'] = 'creating';
  TerminalState['ACTIVE'] = 'active';
  TerminalState['INACTIVE'] = 'inactive';
  TerminalState['BUSY'] = 'busy';
  TerminalState['CLOSING'] = 'closing';
  TerminalState['CLOSED'] = 'closed';
  TerminalState['ERROR'] = 'error';
})(TerminalState || (exports.TerminalState = TerminalState = {}));
/**
 * セッション操作の種類
 */
var SessionOperation;
(function (SessionOperation) {
  SessionOperation['SAVE'] = 'save';
  SessionOperation['RESTORE'] = 'restore';
  SessionOperation['CLEAR'] = 'clear';
  SessionOperation['EXPORT'] = 'export';
  SessionOperation['IMPORT'] = 'import';
})(SessionOperation || (exports.SessionOperation = SessionOperation = {}));
/**
 * パフォーマンスメトリクスの種類
 */
var PerformanceMetric;
(function (PerformanceMetric) {
  PerformanceMetric['INITIALIZATION_TIME'] = 'initializationTime';
  PerformanceMetric['OPERATION_COUNT'] = 'operationCount';
  PerformanceMetric['AVERAGE_OPERATION_TIME'] = 'averageOperationTime';
  PerformanceMetric['ERROR_RATE'] = 'errorRate';
  PerformanceMetric['MEMORY_USAGE'] = 'memoryUsage';
  PerformanceMetric['CPU_USAGE'] = 'cpuUsage';
})(PerformanceMetric || (exports.PerformanceMetric = PerformanceMetric = {}));
/**
 * リソースの種類
 */
var ResourceType;
(function (ResourceType) {
  ResourceType['EVENT_LISTENER'] = 'eventListener';
  ResourceType['TIMER'] = 'timer';
  ResourceType['INTERVAL'] = 'interval';
  ResourceType['SUBSCRIPTION'] = 'subscription';
  ResourceType['CONNECTION'] = 'connection';
  ResourceType['STREAM'] = 'stream';
  ResourceType['OBSERVER'] = 'observer';
})(ResourceType || (exports.ResourceType = ResourceType = {}));
/**
 * 設定カテゴリ
 */
var ConfigurationCategory;
(function (ConfigurationCategory) {
  ConfigurationCategory['TERMINAL'] = 'terminal';
  ConfigurationCategory['APPEARANCE'] = 'appearance';
  ConfigurationCategory['BEHAVIOR'] = 'behavior';
  ConfigurationCategory['PERFORMANCE'] = 'performance';
  ConfigurationCategory['ADVANCED'] = 'advanced';
  ConfigurationCategory['DEBUG'] = 'debug';
})(ConfigurationCategory || (exports.ConfigurationCategory = ConfigurationCategory = {}));
//# sourceMappingURL=EnumConstants.js.map
