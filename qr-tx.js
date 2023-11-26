
import QRious from 'qrious'

const blank = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

const template = new DOMParser().parseFromString(`
<section style="display: flex; flex-direction: column;">
    <video style="height: 30vmin"></video>

    <div style="display: flex; width: 100vw;">
        <img src="${blank}" data-qr="rx" style="width: 45vw; height: auto; margin: 1vw; image-rendering: pixelated" />
        <img src="${blank}" data-qr="tx" style="width: 45vw; height: auto; margin: 1vw; image-rendering: pixelated" />
    </div>

</section>
`, "text/html").body;


const detector = new BarcodeDetector({
    formats: ["qr_code"],
});


export class QRSocket extends EventTarget {
    constructor() {
        super();
        this.element = template.cloneNode(true)
        this.queue = []
        this.txi = 0;
        this.rxi = -1;
        this.listeners = new Set();
    }

    async send(data) {
        this.queue.push(data)
        this.showLatest()
    }

    showLatest() {
        if (this.queue.length > 0)
            this.setQR('tx', 'tx:' + this.txi + ',' + this.queue[0])
        else {
            this.setQR('tx', 'noop')
        }
    }


    async start() {
        this.setQR('rx', document.location.href)

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user'
            },
            audio: false
        });

        const video = this.element.querySelector('video');
        video.srcObject = stream;
        video.play()

        this.running = true;

        const check = async () => {
            await new Promise(re => setTimeout(re, 2000))
            while (this.running) {
                try {
                    // console.time("scan")
                    const codes = await detector.detect(video)
                    // console.log(codes)
                    for (const code of codes) {

                        const value = code.rawValue


                        if (value === document.location.href) {
                            // start

                            console.log("START")
                            this.showLatest()

                        }

                        if (value.startsWith('tx:')) {
                            const rest = value.slice(3)

                            const code = parseInt(rest.split(',')[0])

                            if (code === this.rxi) {
                                console.log("already seen", code)
                                continue
                            }

                            this.rxi = code

                            const data = rest.slice(rest.indexOf(',') + 1);

                            console.log("DATA", data)


                            this.dispatchEvent(
                                new MessageEvent('message', { data })
                            );

                            this.setQR('rx', 'rx:' + code)

                        }

                        if (value.startsWith('rx:')) {
                            const rxval = parseInt(value.slice(3))

                            if (rxval === this.txi) {
                                this.txi++
                                this.queue.shift();

                                this.showLatest()
                            }
                        }
                    }
                    // avoid when tab is hidden
                    await new Promise(requestAnimationFrame)
                } catch (e) {// video not ready?
                    console.error(e)
                    await new Promise(re => setTimeout(re, 1000))
                }
            }
        }

        check()
    }

    setQR(name, value) {
        new QRious({
            element: this.element.querySelector(`[data-qr="${name}"]`),
            value
        });
    }
}

