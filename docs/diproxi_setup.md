# Client MITM (WIP)
Using mitmproxy, it is possible to run many applications on Reflectcord, even those that are distributed in binary form. This guide details how to
use the Diproxi script for mitmproxy to run Discord clients that don't allow configurable API URLs. This can even be used to run the official
client on Reflectcord.

## Preqesuites
mitmproxy

## Downloading Diproxy
You can get Diproxy from [here](https://github.com/V3L0C1T13S/diproxi). You can either use git clone, or download it as a zip.

## Running
To run Diproxi, use this command in the root directory

`mitmproxy --ssl-insecure --set upstream_cert=false -s proxy.py`

## Connecting
In order to connect to Diproxi correctly, you'll need to change your proxy settings to the IP and port of your mitmproxy server. By default,
this is http://localhost:8080.

Next, go to http://mitm.it, and follow the instructions for your operating system.

**NOTE:** If you are using Firefox, follow the Firefox instructions, otherwise mitmproxy will not be able to intercept Firefox requests.

## Using on a per-app basis (Linux)
Linux allows you to set up proxies on a per-app basis. To do this, simply set the two environment variables `HTTP_PROXY` and `HTTPS_PROXY` to
your mitmproxy server IP.
