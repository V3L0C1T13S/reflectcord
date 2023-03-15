# Reflectcord
[<img src="https://img.shields.io/badge/dynamic/json?labelColor=ff6e6d&color=15283f&label=Revolt%20Server&query=member_count&suffix=%20Members&url=https%3A%2F%2Fapi.revolt.chat%2Finvites%2FsasJBbfb&style=for-the-badge&cacheSeconds=60" />](https://rvlt.gg/sasJBbfb) <!-- @EnokiUN made this uwu -->

REST and Websocket compatibility layer for Discord->Revolt

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

![image](https://user-images.githubusercontent.com/51764975/212494409-017dd53d-a958-4a0e-bdfa-2af3f26bd62d.png)
![image](https://user-images.githubusercontent.com/51764975/212494374-ce01cedb-31fd-4431-bb67-08ae6a70d2f9.png)

## Setup

See docs/setup.md

## Credits

### [Fosscord](https://github.com/fosscord)
Server structure, larger utilities, 99% of the work reverse engineering the gateway, more obscure parts of Discords API, the entire WebRTC stack, API middlewares, the client downloader, and more is thanks to the work of Fosscord and its contributors. Seriously, check them out!

### [Litecord](https://gitlab.com/litecord/litecord)
Documented a bunch of undocumented OPCodes, reverse engineered OP8

### [Luna's Unofficial Discord Docs](https://luna.gitlab.io/discord-unofficial-docs)
Mainly responsible for documenting settings protobufs, along with tons of OPCodes.

### [ouwou - Discord Undocumented](https://github.com/ouwou/discord-undocumented)
Documented features such as search and slash commands
