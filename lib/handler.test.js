import { Transmitter, SocketBase } from "./handler.js"
import { expect } from 'chai'


describe("Transmitter", () => {

    it("works", () => {
        const t = new Transmitter()

        expect(t.current).to.deep.equal([0, 'noop'])

        const hello = t.send("Hello")
        const world = t.send("World")

        expect(t.current).to.deep.equal([1, 'Hello'])


        t.awk(44122)

        expect(t.current).to.deep.equal([1, 'Hello'])

        t.awk(1)

        expect(t.current).to.deep.equal([2, 'World'])

        t.awk(2)

        expect(t.current).to.deep.equal([0, 'noop'])


    })

})


describe("SocketBase", () => {


    it("starts with the init", () => {
        const base = new SocketBase("foobar")
        expect(base.current).to.equal("foobar")
    })

    it("initiates when sees init", () => {
        const base = new SocketBase("foobar")

        base.handleObservation("foobar")

        expect(base.current).to.equal('[0,0,"noop"]')
    })

    it("initiates when sees valid message", () => {
        const base = new SocketBase("foobar")

        base.handleObservation('[0,0,"blah"]')

        expect(base.current).to.equal('[0,0,"noop"]')
    })

    it("broadcasts messages", () => {
        const base = new SocketBase("foobar")

        base.handleObservation("foobar")
        base.enqueueMessage("hello")
        base.enqueueMessage("world")

        expect(base.current).to.equal('[0,1,"!hello"]')

        base.handleObservation('[1,0,"noop"]')
        expect(base.current).to.equal('[0,2,"!world"]')

        base.handleObservation('foo')
        expect(base.current).to.equal('[0,2,"!world"]')

        base.handleObservation('[2,0,"noop"]')
        expect(base.current).to.equal('[0,0,"noop"]')

    })

    it("communicates", async () => {
        const a = new SocketBase("_")
        const b = new SocketBase("_")

        a.handleObservation('_')
        b.handleObservation('_')

        let delivered = false;
        a.enqueueMessage("hello from a")
            .then(() => { delivered = true })

        const b_resp = b.handleObservation(a.current)

        expect(b_resp).to.equal("hello from a")


        // confirmation
        expect(delivered).to.equal(false)
        a.handleObservation(b.current)
        await new Promise(d => setTimeout(d, 10))
        expect(delivered).to.equal(true)


    })





})
