const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

// Load .env from repo root (silently skipped if not present — mock mode still works)
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const dataServiceMode = process.env.VITE_DATA_SERVICE_MODE || 'mock';

const srcRoot = path.resolve(__dirname, '../src/webparts/hbcProjectControls');

module.exports = {
  entry: path.resolve(__dirname, 'index.tsx'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash:8].js',
    publicPath: '/',
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: [
      path.resolve(__dirname, '../node_modules'),
      'node_modules',
    ],
    alias: {
      // tsconfig path aliases (app-only)
      '@webparts': path.resolve(__dirname, '../src/webparts'),
      '@components': path.resolve(srcRoot, 'components'),
      '@hooks': path.resolve(srcRoot, 'components/hooks'),
      '@contexts': path.resolve(srcRoot, 'components/contexts'),
      '@theme': path.resolve(srcRoot, 'theme'),

      // Point to source for HMR during dev
      '@hbc/sp-services': path.resolve(__dirname, '../packages/hbc-sp-services/src'),

      // Prevent nested @fluentui/react-icons copies
      '@fluentui/react-icons': path.resolve(__dirname, '../node_modules/@fluentui/react-icons'),

      // Force React 18 from root (SPFx packages nest react-dom@17 which lacks client.js)
      'react': path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
      'react-dom/client': path.resolve(__dirname, '../node_modules/react-dom/client'),
      'scheduler': path.resolve(__dirname, '../node_modules/scheduler'),

      // SP shims — safety net for transitive imports
      '@microsoft/sp-core-library': path.resolve(__dirname, 'shims/sp-core-library.ts'),
      '@microsoft/sp-webpart-base': path.resolve(__dirname, 'shims/sp-webpart-base.ts'),
      '@microsoft/sp-property-pane': path.resolve(__dirname, 'shims/sp-property-pane.ts'),
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: path.resolve(__dirname, 'tsconfig.json'),
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/i,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'index.html'),
    }),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_USE_MOCK': JSON.stringify(dataServiceMode !== 'standalone' ? 'true' : 'false'),
      'process.env.DEMO_MODE': JSON.stringify('false'),
      'process.env.DATA_SERVICE_MODE': JSON.stringify(dataServiceMode),
      'process.env.AAD_CLIENT_ID': JSON.stringify(process.env.VITE_AAD_CLIENT_ID || ''),
      'process.env.AAD_TENANT_ID': JSON.stringify(process.env.VITE_AAD_TENANT_ID || ''),
      'process.env.SP_HUB_URL': JSON.stringify(process.env.VITE_SP_HUB_URL || ''),
      'process.env.APPINSIGHTS_CONNECTION_STRING': JSON.stringify(
        process.env.VITE_APPINSIGHTS_CONNECTION_STRING || ''
      ),
    }),
    // Copy public/ assets (manifest.json, sw.js, offline.html, icons) to output
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, '..', 'public'), to: '.', noErrorOnMissing: true },
      ],
    }),
  ],

  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
  },

  devtool: 'eval-source-map',
};
