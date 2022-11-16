# Voice
Reflectcord has its own implementation of Discord voice,
internally known as RDVSP (Reflectcord voice server protocol).

It has guaranteed compatibility with Discord voice V4 and above,
with some compatibility for older versions.

Note that RDVSP does not currently support bridging Vortex (Revolt voice chat),
and there are no plans to do so until Revolt is completed with rewriting Vortex,
and it is deployed on the official Revolt instance.

## Capabilities
- Voice chat
- Video chat

## Requirements
A recent version of Linux, MacOS X, or FreeBSD 13.1+ with Linuxulator enabled

This is due to the WebRTC server, medooze, only supporting
the above systems.
