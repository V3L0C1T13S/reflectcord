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

## Configuring

See [configuring.md](configuring.md)
