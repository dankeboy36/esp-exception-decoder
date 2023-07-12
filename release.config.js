//@ts-check
'use strict';

/** @type {import('semantic-release').Options} */
module.exports = {
  tagFormat: '${version}',
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
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
        packageVsix: true,
        publish: true,
      },
    ],
    [
      '@semantic-release/exec',
      {
        publishCmd:
          'echo "release_version=${nextRelease.version}" >> $GITHUB_OUTPUT',
      },
    ],
  ],
};
