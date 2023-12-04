
import QRious from 'qrious'

const blank = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

const className = "✨" + Math.random().toString(36).slice(2)

const template = new DOMParser().parseFromString(`
<section class="${className}">
    <img src="${blank}" data-qr="rx" />
    <video></video>
    <img src="${blank}" data-qr="tx" />

    <style>
    .${className} {
        display: flex;
        align-items: center;
        width: 90vw;
        height: 90vh;
        position: absolute;
    }
    .${className} img {
        margin: 3vmin;
        image-rendering: pixelated;
        flex: 1;
        height: auto;
        width: auto;
        max-height: 80vh;
        max-width: 80vw;
    }
    .${className} video {
        flex: 0.3;
        max-width: 20vw;
        max-height: 20vh;
    }
    @media (orientation: landscape) {
        .${className} {
          flex-direction: row;
        }
    }
    @media (orientation: portrait) {
        .${className} {
            flex-direction: column;
        }
    }
</style>

</section>
`, "text/html").body;


const detector = new BarcodeDetector({
    formats: ["qr_code"],
});

const chunking = true;


export class QRSocket extends EventTarget {
    constructor(options = {}) {
        super();
        this.element = template.cloneNode(true)
        this.queue = []
        this.txi = 0;
        this.rxi = -1;
        this.listeners = new Set();
        this.options = options;
        this.currenChunk = '';

        (options.target || document.body).appendChild(this.element);

        this.start()
    }

    async send(data) {
        console.log("SEND", data)
        if (chunking) {
            const chunks = data.match(/.{1,48}/g)
            for (const chunk of chunks) {
                this.queue.push("+" + chunk)
            }
            this.queue.push("!") // this could include the last chunk
        } else {
            this.queue.push(data)
        }

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

        const stream = this.stream = await navigator.mediaDevices.getUserMedia({
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
                    const codes = await detector.detect(video)

                    for (const code of codes) {

                        const value = code.rawValue
                        if (value === document.location.href) {
                            // start
                            // console.log("START")
                            this.showLatest()
                        }

                        if (value.startsWith('tx:')) {
                            const rest = value.slice(3)

                            const code = parseInt(rest.split(',')[0])

                            if (code === this.rxi) {
                                // console.log("already seen", code)
                                continue
                            }

                            this.rxi = code

                            const data = rest.slice(rest.indexOf(',') + 1);

                            console.log("DATA", data)

                            if (chunking) {
                                const first = data[0]
                                if (first === '+') {
                                    this.currenChunk += data.slice(1)
                                } else if (first === '!') {
                                    const data = this.currenChunk;
                                    this.dispatchEvent(
                                        new MessageEvent('message', { data })
                                    )
                                    this.currenChunk = ''
                                } else {
                                    console.warn("Invalid chunk", data)
                                }
                            } else {
                                this.dispatchEvent(
                                    new MessageEvent('message', { data })
                                );
                            }


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

    stop(discardStream = true) {
        this.running = false;
        const video = this.element.querySelector('video')
        if (discardStream) {
            video.srcObject.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        this.element.remove()
    }
}

