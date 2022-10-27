# Reflectcord setup

This document contains instructions for setting up Reflectcord on an Ubuntu 22.04.1 LTS machine.

## Before we begin...

Keep in mind, Reflectcord is currently DEVELOPMENT stage software, stability is rare, and you will likely have a subpar experience at **most** using the offical Discord client.

## Installing needed packages
First off, you should install NodeJS version 18 or higher.

Second, you'll either need to install MongoDB onto your system, or configure the .env to point to an existing MongoDB instance.

Third, clone this repo using git, cd into Reflectcord, and run `npm i` to install the needed packages. You can now start the server in two ways:

1. Dev mode
`npm run start:dev`

2. Building for production
`npm run build`
`npm run start`

Dev mode is recommended if you'll be making frequent changes to the codebase, however it's less efficient as it transpiles and runs Typescript in real time.

On the other hand, production mode takes longer to build and make changes to, but it's much more efficient and uses less memory, so it's recommended if you won't be making changes to the code.

## Configuring

See configuring.md
