export class Transmitter {
    constructor() {
        this.id = 0;
        this.queue = [];
    }
    send(message) {
        return new Promise(resolve => {
            let id = ++this.id;
            this.queue.push([id, message, resolve])
        })
    }
    awk(seen) {
        if (this.queue.length > 0) {
            const [id, , resolver] = this.queue[0];

            if (id === seen) {
                resolver()
                this.queue.shift();
            }
        }
    }
    get current() {
        if (this.queue.length > 0) {
            const [id, message] = this.queue[0];
            return [id, message];
        }
        return [0, 'noop']
    }
}


export class Receiver {
    constructor() {
        this.lastSeen = 0;
    }
    receive(key, message) {
        if (key !== this.lastSeen) {
            this.lastSeen = key;
            return message;
        }
        return null;
    }
    get current() {
        return [this.lastSeen]
    }
}


// Chunking

export class ChunkedTransmitter extends Transmitter {
    constructor() {
        super()
    }


    send(message) {
        const chunks = message.match(/.{1,100}/g)

        const promises = chunks.map((v, i, { length }) => {
            const last = (i === length - 1);

            const prefix = last ? '!' : '+';

            return super.send(prefix + v);
        })

        return Promise.all(promises);
    }
}


export class ChunkedReceiver extends Receiver {
    constructor() {
        super()
        this.parts = []
    }

    receive(key, message) {
        const resp = super.receive(key, message)

        if (resp) {
            const prefix = resp.slice(0, 1)
            const rest = resp.slice(1)
            this.parts.push(rest)

            if (prefix === '!') {
                const all = this.parts.join('')

                this.parts = []

                return all;
            }
            if (prefix !== '+') throw new Error("unexpected key")
        }

        return null;
    }
}



export class SocketBase {

    constructor(init) {
        this.init = init;

        this.tx = new ChunkedTransmitter()
        this.rx = new ChunkedReceiver()

        this.started = false;
    }

    /** Enqueue a message to be sent by QR code */
    enqueueMessage(message) {
        return this.tx.send(message);
    }

    /** Handle an observed QR code */
    handleObservation(code) {
        if (!this.started) {
            if (code === this.init || decode(code)) {
                this.started = true;
                return;
            }
        }

        const parts = decode(code);
        if (!parts) return;

        const [rx, tx, message] = parts;

        this.tx.awk(rx);

        // ignore noop messages
        if (tx === 0) return;

        return this.rx.receive(tx, message)
    }

    /** What should be displayed in out QR code */
    get current() {
        if (!this.started) return this.init;

        return encode(
            this.rx.lastSeen,
            ...this.tx.current
        )

    }
}



///


export function decode(str) {
    try {
        const p = JSON.parse(str)
        if (typeof p[0] !== 'number' ||
            typeof p[1] !== 'number' ||
            typeof p[2] !== 'string' ||
            p.length !== 3
        ) {
            console.warn("Invalid structure", p)

            return null;
        }
        return p;
    } catch (e) {
        return null;
    }
}

export function encode(rx, tx, rest) {
    return JSON.stringify([rx, tx, rest])

}
