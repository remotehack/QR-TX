
import QRious from 'qrious'
import { SocketBase } from './lib/handler.js';

const blank = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

const className = "✨" + Math.random().toString(36).slice(2)

const template = new DOMParser().parseFromString(`
<section class="${className}">
    <figure class="qr">
        <img src="${blank}"/>
        <figcaption>[]</figcaption>
    </figure>
    <figure class="video">
        <video></video>
        <figcaption>[]</figcaption>
    </figure>

    <style>
    .${className} {
        display: flex;
        align-items: center;
        justify-items: top;
        width: 90vmin;
        height: 90vmin;
        margin:auto;
    }
    .${className} img {
        image-rendering: pixelated;
        height: 50vmin;
        width: 50vmin;
        aspect-ratio: 1 / 1;
    }
    .${className} video {
        height: 25vmin;
        width: 25vmin;
        object-fit:cover;
    }
    .${className} figcaption {
        width: 25vmin;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .${className} .qr figcaption{
        width: 50vmin;
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
`, "text/html").body.firstChild;


const detector = new BarcodeDetector({
    formats: ["qr_code"],
});

const chunking = true;


export class QRSocket extends EventTarget {
    constructor(options = {}) {
        super();
        this.sock = new SocketBase(document.location.href)
        window.q = this

        this.element = template.cloneNode(true)
        this.queue = []
        this.txi = 0;
        this.rxi = -1;
        this.options = options;
        this.currenChunk = '';

        (options.target || document.body).appendChild(this.element);

        this.start()
    }

    async send(data) {
        return this.sock.enqueueMessage(data)
    }

    showLatest() {
        this.setQR('rx', this.sock.current);
    }


    async start() {
        this.setQR('rx', this.sock.current);

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
                        const completed = this.sock.handleObservation(code.rawValue);

                        if (completed) {
                            this.dispatchEvent(
                                new MessageEvent('message', { data: completed })
                            )
                        }

                        this.element.querySelector('.video figcaption').innerText = code.rawValue

                    }

                    if (codes.length > 0) {
                        this.setQR('rx', this.sock.current);
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
        console.log("setQR:", name, value)

        new QRious({
            element: this.element.querySelector(`img`),
            value
        });
        this.element.querySelector('.qr figcaption').innerText = value
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

