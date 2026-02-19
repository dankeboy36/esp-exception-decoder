// @ts-check
'use strict'

const path = require('path')

/** @type {import('webpack').Configuration} */
const extensionConfig = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: (info) => {
      const normalizedPath = info.absoluteResourcePath.replace(/\\/g, '/')
      return normalizedPath.startsWith('/')
        ? `file://${normalizedPath}`
        : `file:///${normalizedPath}`
    },
    devtoolFallbackModuleFilenameTemplate: 'file:///[absolute-resource-path]',
  },
  externals: {
    vscode: 'commonjs vscode',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: 'log',
  },
}
module.exports = [extensionConfig]
