# QR-TX

Send stuff back and forward with QR Codes.

```js
const socket = new QRSocket();

socket.on("message", (message) => {
  console.log(message);
});

socket.send("Hello World!");
```
