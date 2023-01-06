# Reflectcord

REST and Websocket compatability layer for Discord->Revolt

## Features

### Configurable

Need only the Discord API, but not the CDN? Simply turn it off in the configuration file!

### Secure

Reflectcord runs outside of your Revolt instance, and has to run under the same restrictions as a normal Revolt user.

### Portable

Because Reflectcord is designed to run outside of the instance, it can be used on any instance you desire.

## Project status

Many features are fully or partially implemented. The official client works well for most use cases. Many frameworks have also been validated to work with Reflectcord, such as Discord.js.

API V8 and higher are the most supported. Anything lower is experimental.

To check if your framework of choice or client works with Reflectcord, refer to the [Discord apps wiki](https://github.com/V3L0C1T13S/reflectcord/wiki/Discord-Apps-Wiki)

## Screenshots

![image](https://user-images.githubusercontent.com/51764975/200136609-9d953fe8-2eb7-4f27-a2d3-f0f16a8c0ee4.png)
![image](https://user-images.githubusercontent.com/51764975/200136653-3899a801-01a1-4ffc-9166-fac3fa46d711.png)

## Setup

See docs/setup.md

## Credits

Fosscord - 99% of the work reverse engineering the gateway, some more obscure parts of Discords API, and also created the client downloader.

Litecord - Documented a bunch of undocumented OPCodes

ouwou - Documented features such as search and slash commands
