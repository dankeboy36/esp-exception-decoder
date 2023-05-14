//@ts-check
'use strict';

/** @type {import('semantic-release').Options} */
module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/github',
      {
        assets: [
          {
            path: '*.vsix',
          },
        ],
      },
    ],
    '@semantic-release/git',
    [
      'semantic-release-vsce',
      {
        publish: false, // Do not publish to VS Code Marketplace, but to Open VSX
      },
    ],
    [
      '@semantic-release/exec',
      {
        publishCmd:
          'echo "::set-output name=release_version::${nextRelease.version}"',
      },
    ],
  ],
};
