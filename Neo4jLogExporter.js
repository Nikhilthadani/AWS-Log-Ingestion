const { ExportResultCode } = require("@opentelemetry/core");

class Neo4jLogExporter {
  constructor(driver) {
    this.driver = driver;
  }

  async export(logRecords, resultCallback) {
    const session = this.driver.session();

    try {
      await session.writeTransaction(async (tx) => {
        for (const record of logRecords) {
          const { body, attributes, severityText, resource } = record;
          const timestamp = Date.now();
          const userId = 1234566;
          console.log({
            body,
            attributes,
            severityText,
            timestamp,
            resource,
            userId,
          });

          const serviceName =
            resource?.attributes?.["service.name"] || "unknown";
          const source = attributes?.source || "unknown";
          const type = attributes?.type || "general";

          await tx.run(
            `
  MERGE (s:Service {name: $serviceName})
  CREATE (l:Log {
    body: $body,
    severity: $severityText,
    timestamp: $timestamp,
    source: $source,
    type: $type,
    userId: $userId
  })
  MERGE (s)-[:EMITTED]->(l)
  `,
            {
              serviceName,
              body: typeof body === "string" ? body : JSON.stringify(body),
              severityText: severityText || "INFO",
              timestamp: timestamp?.[0] || Date.now(),
              source,
              type,
              userId,
            }
          );
        }
      });

      resultCallback({ code: ExportResultCode.SUCCESS });
    } catch (err) {
      // console.error("Neo4jLogExporter error:", err);
      resultCallback({ code: ExportResultCode.FAILED });
    } finally {
      await session.close();
    }
  }

  async shutdown() {
    await this.driver.close();
  }
}

module.exports = Neo4jLogExporter;
