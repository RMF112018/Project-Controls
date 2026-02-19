'use strict';

const path = require('path');
const build = require('@microsoft/sp-build-web');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isAnalyze = process.argv.includes('--analyze');
const isShip = process.argv.includes('--ship');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

// Extend SPFx webpack config to resolve @hbc/sp-services workspace package
build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    if (!generatedConfiguration.resolve) {
      generatedConfiguration.resolve = {};
    }
    if (!generatedConfiguration.resolve.alias) {
      generatedConfiguration.resolve.alias = {};
    }

    generatedConfiguration.resolve.alias['@hbc/sp-services'] =
      path.resolve(__dirname, 'packages/hbc-sp-services/lib');

    if (isAnalyze) {
      generatedConfiguration.plugins = generatedConfiguration.plugins || [];
      generatedConfiguration.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: isShip ? 'static' : 'server',
          openAnalyzer: !isShip,
          reportFilename: '../temp/analyze/spfx-bundle-report.html',
          generateStatsFile: true,
          statsFilename: '../temp/analyze/spfx-stats.json',
          defaultSizes: 'gzip',
        })
      );
    }

    return generatedConfiguration;
  }
});

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};

build.initialize(require('gulp'));
