'use strict'
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const portfinder = require('portfinder')

const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT)

const devWebpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })
  },
  // cheap-module-eval-source-map is faster for development
  devtool: config.dev.devtool,

  // these devServer options should be customized in /config/index.js
  devServer: {
    clientLogLevel: 'warning',
    historyApiFallback: {
      rewrites: [
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html') },
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'market.html') },
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'mine.html') },
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'about.html') },
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'clubs.html') },
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'club.html') },
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'chatroom.html') },
      ],
    },
    hot: true,
    contentBase: false, // since we use CopyWebpackPlugin.
    compress: true,
    host: HOST || config.dev.host,
    port: PORT || config.dev.port,
    open: config.dev.autoOpenBrowser,
    overlay: config.dev.errorOverlay
      ? { warnings: false, errors: true }
      : false,
    publicPath: config.dev.assetsPublicPath,
    proxy: config.dev.proxyTable,
    quiet: true, // necessary for FriendlyErrorsPlugin
    watchOptions: {
      poll: config.dev.poll,
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': require('../config/dev.env')
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true,
      chunks: ['app']
    }),
    new HtmlWebpackPlugin({
      filename: 'market.html',
      template: 'market.html',
      inject: true,
      chunks: ['market']
    }),
    new HtmlWebpackPlugin({
      filename: 'mine.html',
      template: 'mine.html',
      inject: true,
      chunks: ['mine']
    }),
    new HtmlWebpackPlugin({
      filename: 'about.html',
      template: 'about.html',
      inject: true,
      chunks: ['about']
    }),
    new HtmlWebpackPlugin({
      filename: 'clubs.html',
      template: 'clubs.html',
      inject: true,
      chunks: ['clubs']
    }),
    new HtmlWebpackPlugin({
      filename: 'club.html',
      template: 'club.html',
      inject: true,
      chunks: ['club']
    }),
    new HtmlWebpackPlugin({
      filename: 'chatroom.html',
      template: 'chatroom.html',
      inject: true,
      chunks: ['chatroom']
    }),
    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.dev.assetsSubDirectory,
        ignore: ['.*']
      }
    ])
  ]
})

module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.dev.port
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err)
    } else {
      // publish the new Port, necessary for e2e tests
      process.env.PORT = port
      // add port to devServer config
      devWebpackConfig.devServer.port = port

      // Add FriendlyErrorsPlugin
      devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [`Your application is running here: http://${devWebpackConfig.devServer.host}:${port}`],
        },
        onErrors: config.dev.notifyOnErrors
        ? utils.createNotifierCallback()
        : undefined
      }))

      resolve(devWebpackConfig)
    }
  })
})
