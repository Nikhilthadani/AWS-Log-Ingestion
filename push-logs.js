require("dotenv").config();
const {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
  PutLogEventsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");

const REGION = "ap-south-1";
const LOG_GROUP_NAME = "manual";
const LOG_STREAM_NAME = "testlogstream";

// Initialize client
const client = new CloudWatchLogsClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.ACCESS_KEY_SECRET,
  },
});

async function ensureResources() {
  try {
    await client.send(
      new CreateLogGroupCommand({ logGroupName: LOG_GROUP_NAME })
    );
    console.log("Log group created.");
  } catch (err) {
    if (err.name !== "ResourceAlreadyExistsException")
      console.error("Log group error:", err);
  }

  try {
    await client
      .send(
        new CreateLogStreamCommand({
          logGroupName: LOG_GROUP_NAME,
          logStreamName: LOG_STREAM_NAME,
        })
      )
      .catch((err) => console.log(err));
    console.log("Log stream created.");
  } catch (err) {
    if (err.name !== "ResourceAlreadyExistsException")
      console.error("Log stream error:", err);
  }
}

async function getSequenceToken() {
  const data = await client.send(
    new DescribeLogStreamsCommand({
      logGroupName: LOG_GROUP_NAME,
      logStreamNamePrefix: LOG_STREAM_NAME,
    })
  );
  const stream = data.logStreams.find(
    (s) => s.logStreamName === LOG_STREAM_NAME
  );
  return stream.uploadSequenceToken;
}

async function sendLog(message) {
  const timestamp = Date.now();
  const token = await getSequenceToken();

  const input = {
    logGroupName: LOG_GROUP_NAME,
    logStreamName: LOG_STREAM_NAME,
    logEvents: [
      {
        message,
        timestamp,
      },
    ],
    sequenceToken: token,
  };

  await client.send(new PutLogEventsCommand(input)).catch((err) => console.log);
  console.log("✅ Sent:", message);
}
const DUMMY_LOGS = [
  {
    userId: "user_573",
    action: "LOGGED_IN",
    data: "User logged in",
  },
  {
    userId: "user_573",
    action: "USED_TOKEN",
    data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  },
  {
    userId: "user_152",
    action: "USED_API_KEY",
    data: "sk_test_51H...",
  },
  {
    userId: "user_833",
    action: "USED_PASSWORD",
    data: "hunter2",
  },
  {
    userId: "user_573",
    action: "CONNECTED",
    data: "User connected",
  },
  {
    userId: "user_573",
    action: "DISCONNECTED",
    data: "User disconnected",
  },
  {
    userId: "user_999",
    action: "LOGGED_IN",
    data: "User logged in",
  },
  {
    userId: "user_999",
    action: "USED_TOKEN",
    data: "eyJhbGciOiJIUzI1NiIsImNvbS4uLg==",
  },
  {
    userId: "user_101",
    action: "USED_PASSWORD",
    data: "hunter3",
  },
  {
    userId: "user_101",
    action: "DISCONNECTED",
    data: "User disconnected",
  },
  {
    userId: "user_755",
    action: "CONNECTED",
    data: "User connected",
  },
  {
    userId: "user_573",
    action: "USED_API_KEY",
    data: "sk_test_example_573",
  },
  {
    userId: "user_152",
    action: "CONNECTED",
    data: "User connected",
  },
  {
    userId: "user_152",
    action: "USED_TOKEN",
    data: "eyJhbGciOiJ.secret.152",
  },
  {
    userId: "user_999",
    action: "USED_API_KEY",
    data: "sk_test_user_999_key",
  },
];
(async () => {
  await ensureResources();
  // Dummy interval logger
  setInterval(() => {
    const logMsg = DUMMY_LOGS[Math.floor(Math.random() * DUMMY_LOGS.length)];
    sendLog(JSON.stringify(logMsg)).catch(console.error);
  }, 3000);
})();
