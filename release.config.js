// @ts-check
'use strict'

/** @type {import('semantic-release').Options} */
module.exports = {
  // eslint-disable-next-line no-template-curly-in-string
  tagFormat: '${version}',
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
        tarballDir: 'dist/npm',
      },
    ],
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
          // eslint-disable-next-line no-template-curly-in-string
          'echo "release_version=${nextRelease.version}" >> $GITHUB_OUTPUT',
      },
    ],
  ],
}
