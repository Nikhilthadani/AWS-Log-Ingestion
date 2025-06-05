const detectSensitiveData = require("./detect.js");
const loggerFn = require("./otel-exporter.js");
const fs = require("fs");
const { driver } = require("./neo4j");

async function analyzeBlastRadius(userId) {
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:GENERATED]->(l:Log)
       OPTIONAL MATCH path=(l)-[:PRECEDED*1..5]->(related:Log)
       RETURN l, nodes(path) as relatedNodes`,
      { userId }
    );

    return result.records.map((record) => ({
      log: record.get("l").properties,
      related: record.get("relatedNodes")?.map((node) => node.properties) || [],
    }));
  } finally {
    await session.close();
  }
}

async function main() {
  const logs = JSON.parse(fs.readFileSync("logs.json", { encoding: "utf-8" }));

  const flaggedLogs = detectSensitiveData(logs.map((l) => l.message));
  console.log({ flaggedLogs });

  // Handle flagged logs
  flaggedLogs.forEach((flaggedLog) => {
    loggerFn.emit({
      body: `🔐 Sensitive log found: ${flaggedLog.message}`,
      severityText: "WARN",
      source: "cloudwatch-log",
      type: "sensitive",
      userId: Date.now(),
      timestampe: Date.now(),
      serviceName: "Nodejs-stackguard",
    });
  });

  // Analyze blast radius for users with sensitive data
  const sensitiveUsers = [...new Set(flaggedLogs.map((log) => log.userId))];
  for (const userId of sensitiveUsers) {
    const analysis = await analyzeBlastRadius(userId);
    console.log(`Blast radius for ${userId}:`, analysis);
  }
}

main();
