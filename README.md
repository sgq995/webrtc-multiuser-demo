# WebRTC Multiuse Demo
A simple test for multi-user WebRTC

## How to init?
Download this repository and run the next command at the root folder:
```
npm install
```

## How to run?
At the root folder run the next command:
```
npm start
```

Now a window just opened on your default web browser, or go to https://0.0.0.0:8080/ on your host machine, to get external devices connected, you shall known your ip. Then go to https://<your ip>:8080 using your external device.

When a new user enters to your server, the client side creates a new video and you should see all the cameras and listen to all the mics from every connected device.

**IMPORTANT**: Take care of feedback noise, turn off every mic you can when it occurs.

## What does this includes?
This project has:
- The client side which add video from peers dynamically.
- The server side including HTTP and WebSocket servers.

## LICENSE
MIT
