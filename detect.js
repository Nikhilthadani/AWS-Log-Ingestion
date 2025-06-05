const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
function processLog(logText) {
  const lines = logText.trim().split("\n");
  const result = {};

  for (const line of lines) {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      // Line without ':' assumed to be a general message
      result.message = line.trim();
    } else {
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      result[key] = value;
    }
  }

  return result;
}
module.exports = function detectSensitiveData(logs) {
  // Create a temporary file with logs
  const tempFile = path.join(__dirname, "temp-logs.txt");
  fs.writeFileSync(tempFile, JSON.stringify(logs));
  try {
    // Execute StackGuard binary (assumes it's in the project root)
    const result = spawnSync("./StackGuard", ["filesystem", tempFile], {
      encoding: "utf-8",
    });
    const jsonLog = processLog(result.stdout.toString());
    console.log({ jsonLog: JSON.stringify(jsonLog) });

    fs.writeFileSync("sensitivedata.json", JSON.stringify(jsonLog));
    return [{ ...JSON.parse(JSON.stringify(jsonLog)) }];
  } catch (err) {
    console.error("StackGuard execution failed:", err);
    // fs.unlinkSync(tempFile);
    return [];
  }
};
