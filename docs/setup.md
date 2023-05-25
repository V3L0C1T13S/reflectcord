# Reflectcord setup

This document contains instructions for setting up Reflectcord on Ubuntu 22.04.1 LTS.

## Before we begin...

Keep in mind, Reflectcord is currently DEVELOPMENT stage software, stability is rare, and you will likely have a subpar experience at **most** using the official Discord client.

### For WSL users

While WSL2 is an officially supported platform, WSL1 is **not** officially supported. Any issues relating to it will be closed as "wontfix".

### A note on native Windows support

In order to install Reflectcord on native Windows, you will need to remove the medooze-media-server dependency from src/voice/package.json.

It is highly recommended you use WSL2 over native Windows, as this will stop voice chat from functioning entirely.

## Requirements

Docker (optional)

NodeJS (v16 & up) & NPM

MongoDB

RabbitMQ

CMake

## Setting up

### Prerequisites

#### Downloading Reflectcord

Reflectcord uses a feature called git submodules. In order to download the required submodules, you'll need to clone the repository with `git clone --recursive <repourl>`.

#### RabbitMQ

RabbitMQ is needed for the microservices in Reflectcord to communicate with each other. You can install it with the command below:

`sudo apt install rabbitmq-server`

After installation, Ubuntu will automatically start the systemd service for RabbitMQ.

Alternatively, you can use Docker to run RabbitMQ.

`docker run -d --hostname reflectcord --name reflectcord-rabbit -p 5672:5672 rabbitmq:3.11-management`

#### Installing Reflectcord native dependencies

Reflectcord native is the C++ code that some parts of Reflectcord call into. To install them, run this command in your terminal:

`sudo apt install build-essential cmake g++`

#### Dependencies

To install Reflectcords dependencies, simply run `npm i` into where you cloned it.

## Running

1. Dev mode
`npm run start:dev`

2. Building for production (not complete)
`npm run build`
`npm run start`

Dev mode is recommended if you'll be making frequent changes to the codebase, however it's less efficient as it transpiles and runs Typescript in real time.

On the other hand, production mode takes longer to build and make changes to, but it's much more efficient and uses less memory, so it's recommended if you won't be making changes to the code.

3. Monolith mode
`npm run start:monolith`

OR

`npm run start:monolith:dev`

Monolith mode is a special mode useful for memory-constrained environments, where all microservices run under the same process.

This mode is **heavily** unrecommended for production, especially in cases where you may end up processing tons of API requests, or where you will have to dispatch tons of Gateway events.

If the API, Gateway, or CDN start to lag behind, all of them lag behind, and could potentially cause a server lockup.

## Configuring

See [configuring.md](configuring.md)
