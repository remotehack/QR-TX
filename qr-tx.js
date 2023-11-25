
import QRious from 'https://cdn.skypack.dev/qrious'

(function () {
    var qr = new QRious({
        element: document.getElementById('qr'),
        value: 'https://github.com/neocotic/qrious'
    });
    console.log(qr.toDataURL())
})();


const template = new DOMParser().parseFromString(`
<section>
    <video style="height: 30vmin"></video>

    <div style="display: flex; width: 100vw">
        <img data-qr="rx" style="width: 45vw; height: auto" />
        <img data-qr="tx" style="width: 45vw; height: auto" />
    </div>


    <output></output>

</section>
`, "text/html").body;

/*
const socket = new QRRCode()

socket.send("foo")

socket.addEventListener("data", ...)

socket.element // video element

socket.close()
*/


const detector = new BarcodeDetector({
    formats: ["qr_code"],
});


export class QRSocket {
    constructor() {
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

    on(type, callback) {
        this.listeners.add(callback)
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

                            // this.setQR('tx', 'tx:' + this.txi + ',' + this.queue[0])

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

                            this.listeners.forEach(l => l(data))

                            this.setQR('rx', 'rx:' + code)

                        }

                        if (value.startsWith('rx:')) {
                            const rxval = parseInt(value.slice(3))

                            if (rxval === this.txi) {
                                this.txi++
                                this.queue.shift();

                                this.showLatest()

                                // this.setQR('tx', 'tx:' + this.txi + ',' + this.queue[0])

                            }

                            // const [code] = rest.split(',')

                            // if (code === this.rxi) { continue }

                            // this.rxi = code

                            // const data = rest.slice(code.length + 1);

                            // console.log("DATA", data)

                            // this.listeners.forEach(l => l(data))

                            // this.setQR('rx', 'rx:' + code)

                        }
                    }
                    // console.timeEnd("scan")

                    // await new Promise(re => setTimeout(re, 100))// todo reduce
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
        // Show 
        new QRious({
            element: this.element.querySelector(`[data-qr="${name}"]`),
            value
        });

    }

}



console.log("---", template)
