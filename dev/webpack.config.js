const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

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
    alias: {
      // tsconfig path aliases
      '@webparts': path.resolve(__dirname, '../src/webparts'),
      '@components': path.resolve(srcRoot, 'components'),
      '@services': path.resolve(srcRoot, 'services'),
      '@models': path.resolve(srcRoot, 'models'),
      '@hooks': path.resolve(srcRoot, 'components/hooks'),
      '@contexts': path.resolve(srcRoot, 'components/contexts'),
      '@utils': path.resolve(srcRoot, 'utils'),
      '@theme': path.resolve(srcRoot, 'theme'),

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
      'process.env.REACT_APP_USE_MOCK': JSON.stringify('true'),
      'process.env.DEMO_MODE': JSON.stringify('false'),
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
