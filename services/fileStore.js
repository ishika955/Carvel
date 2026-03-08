const fs = require("fs");
const path = require("path");

async function readJSON(relativePath, defaultValue) {
  const filePath = path.join(process.cwd(), relativePath);

  // create file if missing
  if (!fs.existsSync(filePath)) {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(defaultValue, null, 2),
      "utf8"
    );
    return defaultValue;
  }

  const raw = await fs.promises.readFile(filePath, "utf8");
  if (!raw.trim()) return defaultValue;

  return JSON.parse(raw);
}

async function writeJSON(relativePath, data) {
  const filePath = path.join(process.cwd(), relativePath);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  // atomic write (safer)
  const tmp = filePath + ".tmp";
  await fs.promises.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.promises.rename(tmp, filePath);
}

module.exports = { readJSON, writeJSON };