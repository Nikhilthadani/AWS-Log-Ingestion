const { config } = require("dotenv");
config();
const fs = require("fs");

const {
  CloudWatchLogsClient,
  GetLogEventsCommand,
  DescribeLogStreamsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");

const REGION = "ap-south-1";
const LOG_GROUP_NAME = "manual";
const LOG_STREAM_NAME = "testlogstream";

const client = new CloudWatchLogsClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.ACCESS_KEY_SECRET,
  },
});

async function getLogs() {
  try {
    const describeResp = await client.send(
      new DescribeLogStreamsCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamNamePrefix: LOG_STREAM_NAME,
      })
    );

    const logStream = describeResp.logStreams.find(
      (s) => s.logStreamName === LOG_STREAM_NAME
    );

    if (!logStream) {
      console.error("Logs stream not found.");
      return;
    }

    const logsResp = await client.send(
      new GetLogEventsCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamName: logStream.logStreamName,
        startTime: Date.now() - 50 * 60 * 1000,
        startFromHead: true,
      })
    );

    if (logsResp.events.length === 0) {
      console.log("No logs found in the time window.");
    }

    logsResp.events.forEach((e) =>
      fs.appendFileSync("logs.txt", "\n" + e.message.toString())
    );
  } catch (err) {
    console.error("Error fettching logs:", err);
  }
}

getLogs();
