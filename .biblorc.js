'use strict';

/* global __dirname */

const Path = require('path');

module.exports = {
  rootDir:    __dirname,
  inputDir:   Path.resolve(__dirname),
  outputDir:  Path.resolve(__dirname, '..', 'cmded.wiki'),
  files: [
    {
      include:  /\/lib\/.*\.ts$/,
      parser:   'typescript',
      compiler: 'typescript',
    },
    {
      include:  /\/docs\/.*\.md$/,
      parser:   'markdown',
      compiler: 'markdown',
    },
  ],
  exclude: [
    /\.d\.ts$/,
    /node_modules|\/spec\//
  ],
  generatorOptions: {
    baseURL: './',
  },
};
