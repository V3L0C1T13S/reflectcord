# Reflectcord
[<img src="https://img.shields.io/badge/dynamic/json?labelColor=ff6e6d&color=15283f&label=Revolt%20Server&query=member_count&suffix=%20Members&url=https%3A%2F%2Fapi.revolt.chat%2Finvites%2FsasJBbfb&style=for-the-badge&cacheSeconds=60" />](https://rvlt.gg/sasJBbfb) <!-- @EnokiUN made this uwu -->


A REST and Websocket compatibility layer for Discord->Revolt

Reflectcord is a compatibility layer for running Discord apps, games, clients, and bots on top of the open source chat platform [Revolt](https://github.com/revoltchat).

In laymans terms, it translates Discord requests to Revolt requests, and gives Discord apps responses in a form they can understand.

## Features

### Configurable

Need only the Discord API, or maybe just the API and Gateway?

Each component of Reflectcord is designed to run as decoupled as possible from other components, and can run fully independently of each other.

### Secure

Reflectcord uses the Revolt public API, so anything that a normal user can't see, Reflectcord can't see either, reducing your attack surface significantly.

### Portable

Reflectcord doesnt have to be deployed on the same server the target Revolt instance is running on. You can run Reflectcord on any public Revolt instance, even if you don't own it!

## Project status

Many features are fully or partially implemented. The official client works well for most use cases. Many frameworks have also been validated to work with Reflectcord, such as Discord.js.

API V8 and higher are considered stable. Anything lower is experimental.

To check if your framework of choice or client works with Reflectcord, refer to the [Discord apps wiki](https://github.com/V3L0C1T13S/reflectcord/wiki/Discord-Apps-Wiki)

## Screenshots

![Reflectcord running Discords official client on the server home page](https://user-images.githubusercontent.com/51764975/212494409-017dd53d-a958-4a0e-bdfa-2af3f26bd62d.png)
![Reflectcord running Discords official client on Revolt's rules channel](https://user-images.githubusercontent.com/51764975/212494374-ce01cedb-31fd-4431-bb67-08ae6a70d2f9.png)
![Reflectcord running the unofficial native and closed source Discord client Ripcord](https://user-images.githubusercontent.com/51764975/226075337-e721b96d-818e-4157-abcc-0ae6a7bbddb7.png)

## Setup

[Server](docs/setup.md)

[Bots](docs/bot_setup.md)

For clients, it's generally recommended you use Diproxi to proxy discord.com requests to your instance.

[Diproxi](docs/diproxi_setup.md)

## Credits

### [Spacebar](https://github.com/spacebarchat)
Server structure, larger utilities, 99% of the work reverse engineering the gateway, more obscure parts of Discords API, the entire WebRTC stack, API middlewares, and more is thanks to the work of Spacebar Chat and its contributors. Seriously, check them out!

### [Litecord](https://gitlab.com/litecord/litecord)
Documented a bunch of undocumented OPCodes, reverse engineered OP8

### [Luna's Unofficial Discord Docs](https://luna.gitlab.io/discord-unofficial-docs)
Mainly responsible for documenting settings protobufs, along with tons of OPCodes.

### [ouwou - Discord Undocumented](https://github.com/ouwou/discord-undocumented)
Documented features such as search and slash commands

## Disclaimer
Discord is trademark of Discord Inc. and solely mentioned for the sake of descriptivity. Mention of it does not imply any affiliation with or endorsement by Discord Inc.
