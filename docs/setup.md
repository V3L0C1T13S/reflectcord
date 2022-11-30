# Reflectcord setup

This document contains instructions for setting up Reflectcord on Ubuntu 22.04.1 LTS.

## Before we begin...

Keep in mind, Reflectcord is currently DEVELOPMENT stage software, stability is rare, and you will likely have a subpar experience at **most** using the official Discord client.

### For WSL users

While WSL2 is an officially supported platform, WSL1 is **not** officially supported. Any issues relating to it will be closed as "wontfix".

## Requirements

Docker

NodeJS (v18 & up) & NPM

Mongodb

RabbitMQ

## Setting up

### Prerequisites

#### Downloading Reflectcord

Reflectcord uses a feature called git submodules. In order to download the required submodules, you'll need to clone the repository with `git clone --recursive <repourl>`.

#### RabbitMQ

RabbitMQ is needed for the microservices in Reflectcord to communicate with each other. To start RabbitMQ, simply use the command below.

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

See configuring.md
