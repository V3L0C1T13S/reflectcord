# Configuring Reflectcord

Reflectcord is very configurable, allowing you to fine tune settings such as the Revolt instance you want it to use. This document details some of the ways to configure Reflectcord.

**NOTE**: All configuration options are listed in example.env, located in the root directory.

## Changing the Revolt instance

Reflectcord can use any Revolt instance you point it to. For example, a self hosted instance. To set this, simply modify the .env file in the root directory, and point the API endpoints to the instance you would like to use.

**NOTE**: Changing from the official Revolt instance will mean that Discovery features will no longer work. This is due to the official [discovery](https://rvlt.gg) being closed source.

A FOSS alternative called [Open Discovery](https://github.com/V3L0C1T13S/opendiscovery) is being developed. It is not yet complete, but is good enough to allow Reflectcord to use without too many problems.

Keep in mind, like Reflectcord, Open Discovery is an unofficial reverse engineered backend, that Reflectcord does **not** officially support. Due to this, all issues caused by Open Discovery should be reported to their repository.

## Changing client branding

If you plan on hosting your instance publicly, it's recommended you change the client branding to comply
with international copyright laws. Reflectcord makes this extremely easy.

To change your clients branding, modify the INSTANCE_NAME .env variable to your chosen name.
