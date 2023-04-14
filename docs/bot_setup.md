# Using bots on Reflectcord
This guide assumes existing knowledge of your framework.

Reflectcord is a compatibility layer that allows many Discord apps, libraries, and clients to run on Revolt. It's usually very simple to use with many different API libraries. This document outlines how to setup a bot on Reflectcord.

## Creating a bot account
The first thing you'll want to do is to create a bot account on Revolt. To do this, go to your user settings, then click on the bots section.

You should see a button that says "create a bot". Click it, and name your bot accordingly.

Once you've created a bot, you'll need to copy it's token by clicking on the clipboard icon underneath your bot. Change your bots token to this new Revolt token.

## Pointing Discord.js to a custom instance
Pointing Discord.js to a custom instance is very easy. Infact, it was one of the first frameworks to be almost fully compatible with Reflectcord, and is even used in Reflectcord itself for Typescript types.

To point your bot to Reflectcord, simply change your client creation code.

```js
const instanceURL = "http://localhost:3000/api";
const discordClient = new Client({
	...
	rest: {
		api: instanceURL,
	},
	...
});
```

## Troubleshooting

### Setting your token correctly
One of the most common issues that you may encounter is your API wrapper not properly supporting scopes. These are optional on regular Discord, so some API wrappers may not automatically use them. To force your API wrapper to use scoped tokens, simply prepend "Bot " to your token.