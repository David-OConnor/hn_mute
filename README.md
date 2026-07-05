# HN Mute

A minimal Chrome and Firefox extension that lets you mute users on [Hacker News](https://news.ycombinator.com).

Can mute users. Adds a few UI elements to HN to allow muting users by clicking a link next to comments and submissions, and managing your list of muted users. If enough people end up using this, I will integrate a database which can be used to automatically users who others with simular tastes as you muted.

![Example of how to mute users](/screenshots/comment_example_0.png)

Muted users, whether local or using (not-yet-implemented) network effects is not intended to be an objective value judgment, judge of character, or anything universal; it's to tailor results to the user, and is I believe, unfortunately, a useful feature at this time. You may wish, for example, to only engage in contents with others who are human, and intellectually curious.

![Example of managing your muted user list](/screenshots/list_example_0.png)

Examples of why you may wish to mute a user:

- Bots / AI users / promoting low-quality material
- Astroturfing
- Rudeness / anti-social behavior.
- Intellectual (or other) dishonesty
- Incompatible communication styles


Mute lists are stored locally, in your browser's extension's sync storage (chrome.storage.sync / browser.storage.sync). Your browser will sync this across all devices in which you're signed in, and with other opened tabs. I may eventually host this in a remote database, in order to enable the network effects described above.

Mildly inspired by required measures in _[Fall; or, Dodge in Hell](https://en.wikipedia.org/wiki/Fall;_or,_Dodge_in_Hell)._


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

Temporary (for testing; removed on browser restart):

- Open `about:debugging#/runtime/this-firefox`
- Click **Load Temporary Add-on...** and select `manifest.json` from this project.

Permanent: zip the folder contents and submit to
[addons.mozilla.org](https://addons.mozilla.org/developers/) for signing
(self-distribution is fine), or use Firefox Developer Edition / ESR with
`xpinstall.signatures.required = false` in `about:config`.

Before publishing to AMO, change the placeholder add-on ID
(`browser_specific_settings.gecko.id`) in `manifest.json` to something you own.
