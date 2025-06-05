const { defaultResource } = require("@opentelemetry/resources");
const { LoggerProvider } = require("@opentelemetry/sdk-logs");
const { SimpleLogRecordProcessor } = require("@opentelemetry/sdk-logs");
const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");
const Neo4jLogExporter = require("./Neo4jLogExporter");
const { driver } = require("./neo4j");

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const loggerProvider = new LoggerProvider({
  resource: new defaultResource({
    "service.name": "log-analyzer",
  }),
});

const exporter = new Neo4jLogExporter(driver);
loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(exporter));

const logger = loggerProvider.getLogger("log-analyzer");

module.exports = logger;
