//
const path = require("path");
const webpack = require("webpack");
const slsw = require("serverless-webpack");

module.exports = {
  mode: "production",
  entry: slsw.lib.entries,
  target: "node",
  // デフォルトはmain.jsになっちゃうので、handler.jsになるよう指定
  output: {
    libraryTarget: "commonjs",
    path: path.resolve(__dirname, ".webpack"),
    filename: "[name].js"
  },
  module: {}
};
