// Extends Jest's `expect` with @testing-library/jest-dom matchers
// (e.g. toBeInTheDocument) for all test files.
import '@testing-library/jest-dom'
import { MessageChannel as MessageChannelOriginal } from 'node:worker_threads'

// jsdom lacks MessageChannel, which antd's <Form> needs. Use Node's, but unref
// the port so its libuv handle doesn't keep Jest from exiting.


if (!globalThis.MessageChannel) {
  class MessageChannel {
    readonly port1: MessagePort
    readonly port2: MessagePort

    constructor() {
      const channel = new MessageChannelOriginal()
      // unref once antd attaches its onmessage handler: the macrotask still
      // fires during the test, but the port stops blocking Jest's exit.
      this.port1 = new Proxy(channel.port1, {
        set(port, prop, value) {
          const result = Reflect.set(port, prop, value)
          if (prop === 'onmessage') port.unref()
          return result
        },
      }) as unknown as MessagePort
      this.port2 = channel.port2 as unknown as MessagePort
    }
  }
  globalThis.MessageChannel = MessageChannel as unknown as typeof globalThis.MessageChannel
}

// antd components touch browser APIs jsdom doesn't implement (matchMedia,
// ResizeObserver). Polyfill them so rendering forms/inputs doesn't throw.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
