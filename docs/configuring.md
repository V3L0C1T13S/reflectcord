# Configuring Reflectcord

Reflectcord is very configurable, allowing you to fine tune settings such as the Revolt instance you want it to use. This document details some of the ways to configure Reflectcord.

**NOTE**: All configuration options are listed in example.env, located in the root directory.

## Changing the Revolt instance

Reflectcord can use any Revolt instance you point it to. For example, a self hosted instance. To set this, simply modify the .env file in the root directory, and point the API endpoints to the instance you would like to use.

**NOTE**: Changing from the official Revolt instance will mean that Discovery features will no longer work. This is due to the official [discovery](https://rvlt.gg) being closed source. There are no known OSS alternatives to this at the moment, but if any come up, you can change the discovery endpoint in the .env file.
