// @ts-check
'use strict'

/* eslint-disable no-template-curly-in-string */

/** @type {import('semantic-release').Options} */
module.exports = {
  tagFormat: '${version}',
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
        packageVsix: false,
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
}
