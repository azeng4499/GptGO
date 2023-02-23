const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    background: path.resolve(__dirname, "unpacked-background.js"),
  },
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "[name].js",
  },
};
