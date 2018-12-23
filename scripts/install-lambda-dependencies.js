const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const root = path.resolve(__dirname, "../");
const isDirectory = source => fs.lstatSync(source).isDirectory();
const getDirectories = source =>
  fs
    .readdirSync(source)
    .map(name => path.join(source, name))
    .filter(isDirectory);

getDirectories(root).forEach(function(directoryPath) {
  if (!fs.existsSync(path.join(directoryPath, "package.json"))) return;

  console.log(" - Installing dependencies for " + directoryPath); // eslint-disable-line no-console
  cp.spawn("npm", ["i"], {
    env: process.env,
    cwd: directoryPath,
    stdio: "inherit"
  });
});
