# Voice
Reflectcord has its own implementation of Discord voice,
internally known as RDVSP (Reflectcord voice server protocol).

It has guaranteed compatibility with Discord voice V4 and above,
with some compatibility for older versions.

## Backends
- Standalone
- Vortex (WIP)

## Capabilities
- Voice chat
- Video chat

## Requirements
A recent version of Linux, MacOS X, or FreeBSD 13.1+ with Linuxulator enabled

This is due to the WebRTC server, medooze, only supporting
the above systems.

## Selecting a backend
A backend can be selected by using the VOICE_BACKEND environment variable.

Possible values are:
- vortex (default)
- standalone

## Differences

### Vortex
- Bridges connections between Revolts official voice servers and clients
- Supports voice chat across Reflectcord instances
- Depends on Revolt for functionality, so video chat, live streaming, and activites will not work.

### Standalone
- More features can be implemented (ex. video)
- Less likely to crash bots
- You can only talk to people on the same Reflectcord instance as you