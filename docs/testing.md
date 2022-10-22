# Testing Reflectcord

Reflectcord comes with tests built into it, powered by Jest. It aims to cover most of the Discord API for accuracy, regressions, and missing endpoints.

## Running the tests

Running the test suite is easy. Simply run `npm test`, or `npx jest` to get started.

Make sure that you don't build the server though, otherwise the tests will run twice due to Jest automatically detecting the dist folder.
Incase you already did, simply use `npm run clean` to delete the build files.

## General advice

If possible, you should run the test suite with Reflectcord configured to use a self-hosted Revolt instance.

This is to avoid causing unnecessary stress on an actual production instance. It's *probably* fine if you don't, but more preferrable if you do.
