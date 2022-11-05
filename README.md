# Reflectcord

REST and Websocket compatability layer for Discord->Revolt

**TODO:**

- [ ] Websocket (in progress)
- [ ] CDN (in progress)
- [ ] Voice (STALLED - waiting for vortex rewrite)

## Features

### Configurable

Need only the Discord API, but not the CDN? Simply turn it off in the configuration file!

### Secure

Reflectcord runs outside of your Revolt instance, and has to run under the same restrictions as a normal Revolt user.

### Portable

Because Reflectcord is designed to run outside of the instance, it can be used on any instance you desire.

## Setup

See docs/setup.md

## Credits

Fosscord - 99% of the work reverse engineering the gateway, some more obscure parts of Discords API, and also created the client downloader.

Litecord - Documented a bunch of undocumented OPCodes

ouwou - Documented features such as search and slash commands
