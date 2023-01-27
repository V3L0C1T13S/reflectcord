# Reflectcord on Revolt Subsystem for Discord
While there is lots of work by Reflectcord to allow Discord
apps and bots to run on Revolt, there is just as much
work into making sure the message goes both ways. Revolt Subsystem
for Discord is one of those efforts.

Similar to the (mostly abandoned) Reflectcord Evil project,
Revolt Subsystem for Discord translates Revolt API calls into
Discord ones, allowing you to run Revolt bots and apps on Discord.
It also has superior caching in most cases compared to Evil since its powered by the
Discord.js framework.

## Warnings
There really isnt much point in doing this, other than allowing old
(V8 and below) Discord apps to run on the V10 Discord API. You're likely to
lose info between translation, and not to mention the overhead of all that translation,
since RSD is translating Revolt->Discord, and Reflectcord is converting Discord->Revolt.

You're better off porting your app to the latest Discord API if you happen to want
older API support. Better yet, if you need old API support, why not drop Discord altogether?
They're extremely keen on promoting their new interactions APIs, and restricting
bots access to message content.

With all that said, if you for some reason would like to abandon all that is holy,
and run Reflectcord on Revolt Subsystem for Discord, continue reading.

## Prerequisites
* Recent version of RSD
* A good attitude

## Configuring
Change your REVOLT_API_URL and REVOLT_BASE_URL to that of RSD.

## What Reflectcord needs from RSD
Implementation of the /servers, /channels, /users, and /auth endpoints

More Bonfire events - MessageCreate, UserUpdate, NotFound are the core few needed for proper functionality.

Gateway send events (StartTyping, StopTyping)