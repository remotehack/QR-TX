## Replacing the internet with QR Codes

---

![](images/0.svg)

---

![](images/1.svg)

---

![](images/internet.svg)

---

![](images/send.svg)

---

![](images/receive.svg)

---

Can we build this?

---

![fit](images/qrious.png)

![fit](images/barcode-detector.png)

![fit](images/get-user-media.png)

---

```js
// Show a QR Code
new QRious({
  element: this.element.querySelector(`#qrcode`),
  value: "https://your-cool-site.com",
});

// --- other device ---

// Read a QR Code
const detector = new BarcodeDetector({
  formats: ["qr_code"],
});

for (const code of detector.detect(video)) {
  alert(code.rawValue); // "https://your-cool-site.com"!
}
```

[Live Demo](https://remotehack.space/QR-TX/?demo=libs)

---

"the protocol"

# [fit] `[RX, TX, MESSAGE]`

---

# 👀

[Sending messages](https://remotehack.space/QR-TX/?demo=send)

[Speed test](https://remotehack.space/QR-TX/?demo=speed)

[Chat](https://remotehack.space/QR-TX/?demo=chat)

[qRPC](https://remotehack.space/QR-TX/?demo=rpc)

[Signalling](https://remotehack.space/QR-TX/?demo=signalling)

---

# remotehack.space/QR-TX

![fit](images/remote-hack.png)

## ⓧ @benjaminbenben (?)

## 📷 @benfoxall
