# Unofficial Revolt discovery docs

Revolt discovery, also known as rvlt.gg, is the official discovery feature for Revolt's official instance.

While Revolt itself is OSS, rvlt.gg is currently closed source, and the developers have no interest in making it open source. Therefore, I am writing this document in order to assist anybody who wants to create their own client for rvlt.gg.

## Disclaimer

Reflectcord will likely not maintain support for rvlt.gg if its API changes drastically, and a good OSS alternative has come out for it.

This is not simply because rvlt.gg is closed source, but because it only works with the official instance, and Reflectcord is designed to work wherever you want it to.

There are no known alternatives, but feel free to file an issue/PR if you do find one.

## Getting the buildId

In order to get the buildId, you'll need to parse the HTML of one of the pages (ex. rvlt.gg/discover/servers). An element with the id `__NEXT_DATA__` is actually just JSON, and inside it is a buildId property. You can parse this JSON and use it to access the endpoints this way.

## Getting data

Getting data is easy - simply make a GET request to `https://rvlt.gg/_next/data/BUILDID/DATATYPE.json`.

Replace BUILDID with the build id you got from above, and DATATYPE with the type of data you want.

There are 3 types of data - `servers`, `bots`, and `themes`.

Reflectcord has an implementation of getting the servers.json from Revolt, and can be found in /src/api/routes/guild-recommendations/index.

It also has Typescript typings for the API, and their Discord equivalents.
