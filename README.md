# HN Mute

A Chrome and Firefox extension that lets you mute users on [Hacker News](https://news.ycombinator.com).

Can mute users. If enough people end up using this, I will integrate a database which can be used to automatically users who others with simular tastes to you have muted.

Why:

## Build

The extension is written in TypeScript (`src/content.ts`) and compiled to the
`content.js`.

```sh
npm install
npm run build  # or: npm run watch
```

## Install

First run the build above, then:

### Chrome / Edge / Brave

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder

### Firefox

####Temporary (for testing; removed on browser restart):

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...** and select `manifest.json` in this folder

####Permanent: zip the folder contents and submit to
[addons.mozilla.org](https://addons.mozilla.org/developers/) for signing
(self-distribution is fine), or use Firefox Developer Edition / ESR with
`xpinstall.signatures.required = false` in `about:config`.

Before publishing to AMO, change the placeholder add-on ID
(`browser_specific_settings.gecko.id`) in `manifest.json` to something you own.
