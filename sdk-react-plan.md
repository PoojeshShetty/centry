# SDK React — Build Plan

## Overview

`sdk-react` is a browser SDK tailored for React applications. It shares the same core pipeline as the browser SDK (single-user model, module-level span state, no AsyncLocalStorage) but adds:

- **`ErrorBoundary` component** — catches React render errors that `window.onerror` misses
- **`useLogger` hook** — auto-attaches the component name as an attribute on every log
- **HTTP transport** — POSTs logs to a configurable endpoint (no DOM panel)

All other integrations (fetch, xhr, navigation, global errors) are identical to the browser SDK.

---

## Folder Structure

```
sdk-react/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── init.ts
    ├── logger.ts
    ├── captureLog.ts
    ├── stackTrace.ts
    ├── transport.ts
    ├── integrations/
    │   ├── errors.ts
    │   ├── fetch.ts
    │   ├── xhr.ts
    │   └── navigation.ts
    ├── components/
    │   └── ErrorBoundary.tsx
    └── hooks/
        └── useLogger.ts
```

---

## 1. `package.json`

### Purpose
Defines the package identity, entry points, peer dependency on React, and npm link workflow.

```json
{
  "name": "@internal/sdk-react",
  "version": "1.0.0",
  "type": "module",
  "main":  "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types":  "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev":   "tsc --watch"
  },
  "peerDependencies": {
    "react": ">=17.0.0"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/react": "^18.x"
  }
}
```

### Notes
- `peerDependencies` on `react` — SDK does not bundle React, the consuming app provides it
- No runtime dependencies — all browser globals (`fetch`, `XMLHttpRequest`, `history`) are available natively
- `exports` map → consumers do `import { init } from '@internal/sdk-react'`

---

## 2. `tsconfig.json`

### Purpose
Compile `src/` TypeScript (including `.tsx`) to `dist/` with declaration files.

```json
{
  "compilerOptions": {
    "target":          "ES2020",
    "module":          "ESNext",
    "moduleResolution":"Bundler",
    "lib":             ["ES2020", "DOM"],
    "jsx":             "react-jsx",
    "outDir":          "./dist",
    "rootDir":         "./src",
    "declaration":     true,
    "declarationMap":  true,
    "sourceMap":       true,
    "strict":          true,
    "esModuleInterop": true,
    "skipLibCheck":    true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Key decisions

| Option | Why |
|--------|-----|
| `lib: ["DOM"]` | Gives types for `fetch`, `history`, `XHR`, `navigator`, `performance` |
| `jsx: "react-jsx"` | Handles `.tsx` files — React 17+ automatic JSX transform |
| `module: ESNext` | Modern ESM for bundlers (Vite, webpack) |
| `moduleResolution: Bundler` | Correct resolution for Vite/webpack — no `.js` extension required |
| `declaration: true` | Emits `.d.ts` so consuming apps get full type safety |

---

## 3. `src/index.ts` — Public API Surface

### Purpose
Single file that controls what the SDK exposes to consumers.

```ts
export { init }                           from './init.js'
export { logger }                         from './logger.js'
export { ErrorBoundary }                  from './components/ErrorBoundary.js'
export { useLogger }                      from './hooks/useLogger.js'
export type { SdkConfig, LogItem, Frame } from './init.js'
```

### Pseudo code
```
nothing executes here
re-export public symbols from internal modules
ErrorBoundary and useLogger are React-specific — exported alongside core
```

---

## 4. `src/init.ts` — Configuration + Span State Singleton

### Purpose
Accept user config once, store it as a module-level singleton, hold the active span state (replaces AsyncLocalStorage — browser is single-user so module-level state is safe).

### Types

```ts
interface SdkConfig {
  logEndpoint:    string        // dummy or real endpoint to POST logs to
  appName:        string
  environment?:   string        // defaults to 'production'
  release?:       string        // app version or git SHA
  enableLogs?:    boolean       // kill switch, default true
  tracesSampleRate?: number     // 0.0–1.0, controls span sampling, default 1.0
  beforeSendLog?: (log: LogItem) => LogItem | null
}

interface SpanContext {
  traceId:   string   // constant for the whole session
  spanId:    string   // changes per navigation or fetch
  op:        string   // 'pageload', 'navigation', 'http.fetch', etc.
  startedAt: number   // Date.now()
}

interface LogItem {
  timestamp:        string
  level:            string
  severity_number:  number
  body:             string
  trace_id:         string | undefined
  span_id:          string | undefined
  attributes:       Record<string, unknown>
  stack_frames:     Frame[]
}

interface Frame {
  filename:  string
  function:  string
  lineno:    number
  colno:     number
  in_app:    boolean
}
```

### Module-level state

```ts
let _config: SdkConfig | null = null
let _activeSpan: SpanContext | null = null
```

### Functions

**`init(options: SdkConfig): void`**
```
STORE options into _config singleton (apply defaults)
  enableLogs     default true
  environment    default 'production'
  tracesSampleRate default 1.0

IF shouldSample(config.tracesSampleRate)
  start initial pageload span:
    _activeSpan = {
      traceId:   crypto.randomUUID().replace(/-/g, ''),
      spanId:    crypto.randomUUID().slice(0, 16).replace(/-/g, ''),
      op:        'pageload',
      startedAt: Date.now()
    }

INSTALL integrations automatically:
  setupGlobalErrors()     // from integrations/errors.ts
  patchFetch()            // from integrations/fetch.ts
  patchXhr()              // from integrations/xhr.ts
  setupNavigation()       // from integrations/navigation.ts

LOG "[sdk-react] initialized" to console
```

**`getConfig(): SdkConfig`**
```
IF _config is null
  THROW "[sdk-react] call init() before using logger"
RETURN _config
```

**`getActiveSpan(): SpanContext | null`**
```
RETURN _activeSpan
```

**`setActiveSpan(span: SpanContext | null): void`**
```
_activeSpan = span
```

**`shouldSample(rate: number): boolean`**
```
RETURN Math.random() < rate
```

---

## 5. `src/logger.ts` — Public Logging Interface

### Purpose
Expose `logger.info(...)`, `logger.error(...)` etc. Map severity names to OpenTelemetry severity numbers and delegate to `captureLog`.

### Severity mapping (OpenTelemetry spec)

| Method | Severity Number | Behaviour |
|--------|----------------|-----------|
| trace  | 1  | no stack capture |
| debug  | 5  | no stack capture |
| info   | 9  | no stack capture |
| warn   | 13 | no stack capture |
| error  | 17 | **stack trace auto-captured** |
| fatal  | 21 | **stack trace auto-captured** |

### Functions

**`makeLogFn(level, severityNumber): LogFn`** (internal factory)
```
RETURN function(template, params?, attributes?)
  CALL captureLog({ level, severityNumber, template, params, attributes })
```

**`logger`** (exported object)
```
logger.trace = makeLogFn('trace', 1)
logger.debug = makeLogFn('debug', 5)
logger.info  = makeLogFn('info',  9)
logger.warn  = makeLogFn('warn',  13)
logger.error = makeLogFn('error', 17)
logger.fatal = makeLogFn('fatal', 21)
```

### Call signature
```ts
logger.info('User %s clicked %s', [userId, buttonId])
logger.error('Payment failed: %s', [err.message], { 'payment.amount': 99 })
//            template               params            extra attributes
```

---

## 6. `src/captureLog.ts` — The Log Pipeline

### Purpose
Core of the SDK. Takes a raw log call, enriches it with span context + attributes + stack frames, runs the user hook, then sends via transport.

### Functions

**`captureLog(raw: RawLog): void`**
```
GATE 1:
  GET config via getConfig()
  IF config.enableLogs is false → RETURN early

STEP 2 — interpolate body:
  body = replace %s placeholders in raw.template with raw.params sequentially

STEP 3 — capture stack frames (error/fatal only):
  IF raw.severityNumber >= 17
    frames = captureFrames()    // new Error() trick from stackTrace.ts
  ELSE
    frames = []

STEP 4 — read active span context:
  span = getActiveSpan()        // module-level variable from init.ts
  // automatically set by navigation, fetch, init — no threading needed
  // browser is single-user so module-level state is safe

STEP 5 — build SDK default attributes:
  attrs = {
    'sentry.sdk.name':    'sdk-react',
    'sentry.sdk.version': SDK_VERSION,
    'app.name':           config.appName,
    'sentry.environment': config.environment,
    'sentry.release':     config.release,
    'browser.url':        window.location.href,
    'browser.useragent':  navigator.userAgent,
  }
  IF span exists
    attrs['span.op']          = span.op
    attrs['span.duration_ms'] = Date.now() - span.startedAt

  IF raw.params exist
    attrs['sentry.message.template']      = raw.template
    attrs['sentry.message.parameter.N']   = each param (indexed)

STEP 6 — merge user attributes:
  mergedAttrs = { ...attrs, ...serializeAttrs(raw.attributes) }
  // user-supplied attributes win on key clash

STEP 7 — assemble LogItem:
  log = {
    timestamp:       new Date().toISOString(),
    level:           raw.level,
    severity_number: raw.severityNumber,
    body,
    trace_id:        span?.traceId,
    span_id:         span?.spanId,
    attributes:      mergedAttrs,
    stack_frames:    frames
  }

GATE 2 — beforeSendLog hook:
  IF config.beforeSendLog exists
    log = config.beforeSendLog(log)
  IF log is null → RETURN   (user chose to drop this log)

STEP 8 — send via transport:
  send(log)
```

**`serializeAttrs(attrs): Record<string, string | number | boolean>`** (internal)
```
FOR each key-value in attrs
  IF value is object → JSON.stringify(value)
  ELSE keep as-is
RETURN serialized record
```

---

## 7. `src/stackTrace.ts` — Stack Frame Parser

### Purpose
When `logger.error/fatal` is called, capture the current call stack using `new Error()`, strip SDK-internal frames, and return structured `Frame[]`.

### Regex patterns

```ts
// Chrome: "    at PaymentForm.submit (src/components/PaymentForm.tsx:67:14)"
const CHROME_RE = /^\s*at (?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?/

// Chrome anonymous: "    at src/utils.ts:10:5"
const CHROME_ANON_RE = /^\s*at (?:(.+):(\d+):(\d+))$/

// Firefox/Safari: "submit@src/components/PaymentForm.tsx:67:14"
const FF_RE = /^(.*)@(.+):(\d+):(\d+)$/
```

### Functions

**`captureFrames(): Frame[]`**
```
err = new Error()                       // never thrown — only for stack string
                                        // call site is captured here
lines = err.stack.split('\n').slice(1)  // drop "Error" header line
results = []

FOR each line
  frame = parseLine(line)
  IF frame is null → SKIP (unparseable)

  IF frame.filename contains 'sdk-react/src/' → SKIP
    // strip captureFrames, captureLog, logger.error from output
    // so the stack starts from the actual caller

  results.push(frame)

RETURN results
```

**`parseLine(line): Frame | null`** (internal)
```
TRY CHROME_RE  → { function, filename, lineno, colno, in_app: isInApp(filename) }
TRY CHROME_ANON_RE → { function: '<anonymous>', filename, lineno, colno, in_app }
TRY FF_RE      → { function, filename, lineno, colno, in_app }
RETURN null    (no match)
```

**`isInApp(filename): boolean`** (internal)
```
RETURN filename does NOT contain 'node_modules'
   AND filename does NOT contain 'cdn.'
   AND filename does NOT start with 'https://unpkg'
   // everything inside the user's own bundle is "in_app"
```

---

## 8. `src/transport.ts` — HTTP Transport

### Purpose
Send `LogItem` objects to the configured `logEndpoint` via HTTP POST. No DOM panel. Fire-and-forget — transport errors must never crash the app.

### Functions

**`send(log: LogItem): void`**
```
config = getConfig()

payload = JSON.stringify({
  sdk:  'sdk-react',
  log:  log
})

USE navigator.sendBeacon(config.logEndpoint, blob)
  // sendBeacon: fire-and-forget, survives page unload, no CORS preflight
  // blob type: 'application/json'

IF sendBeacon is not available (some environments)
  FALLBACK: fetch(config.logEndpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    payload,
    keepalive: true       // allows request to outlive the page
  })
  .catch(err => console.warn('[sdk-react] transport failed', err))
  // catch here so transport errors never propagate to app code
```

### Dummy endpoint for development
```
logEndpoint: 'http://localhost:4000/logs'
```
Set up a minimal Express server or any HTTP logger (e.g. `npx http-server-debug`) to receive and print the POSTed JSON. No Sentry account required for development.

### Payload shape
```json
{
  "sdk": "sdk-react",
  "log": {
    "timestamp":       "2026-06-15T10:30:00.000Z",
    "level":           "error",
    "severity_number": 17,
    "body":            "Payment failed: card declined",
    "trace_id":        "abc123...",
    "span_id":         "def456...",
    "attributes": {
      "sentry.sdk.name":    "sdk-react",
      "app.name":           "my-react-app",
      "browser.url":        "https://myapp.com/checkout",
      "component.name":     "PaymentForm",
      "payment.amount":     99
    },
    "stack_frames": [
      { "filename": "src/components/PaymentForm.tsx", "function": "handleSubmit", "lineno": 67, "colno": 14, "in_app": true }
    ]
  }
}
```

---

## 9. `src/integrations/errors.ts` — Global Error Handlers

### Purpose
Catch JavaScript errors and unhandled Promise rejections that occur outside React's render tree (setTimeout callbacks, event listeners, async code). Complements `ErrorBoundary` which handles render errors.

### Functions

**`setupGlobalErrors(): void`**
```
SSR GUARD: IF typeof window === 'undefined' → RETURN
  // prevents crash in Next.js server-side render

previousOnError = window.onerror

REPLACE window.onerror with function(message, source, lineno, colno, error)
  logger.fatal('Unhandled error: %s', [message], {
    'error.type':    error?.constructor.name ?? 'UnknownError',
    'error.source':  source,
    'error.lineno':  lineno,
    'error.colno':   colno,
  })
  // stack frames auto-captured by logger.fatal (severityNumber 21 >= 17)

  IF previousOnError → CALL previousOnError(message, source, lineno, colno, error)
  RETURN false   // do not suppress browser's default console error


previousOnUnhandledRejection = window.onunhandledrejection

REPLACE window.onunhandledrejection with function(event)
  reason = event.reason
  message = reason instanceof Error ? reason.message : String(reason)

  logger.fatal('Unhandled promise rejection: %s', [message], {
    'error.type': reason?.constructor.name ?? 'UnhandledRejection',
  })

  IF previousOnUnhandledRejection → CALL previousOnUnhandledRejection(event)
```

---

## 10. `src/integrations/fetch.ts` — Fetch Instrumentation

### Purpose
Monkey-patch `window.fetch` to automatically track outgoing HTTP requests as child spans and inject `sentry-trace` header for distributed tracing.

### Functions

**`patchFetch(): void`**
```
SSR GUARD: IF typeof window === 'undefined' → RETURN

IF window.fetch already patched → RETURN   (double-patch guard)

originalFetch = window.fetch

REPLACE window.fetch with async function(input, init?)
  url    = input instanceof Request ? input.url : String(input)
  method = (init?.method ?? 'GET').toUpperCase()

  parentSpan = getActiveSpan()

  childSpan = {
    traceId:   parentSpan?.traceId ?? generateId(32),
    spanId:    generateId(16),
    op:        'http.fetch',
    startedAt: Date.now()
  }

  setActiveSpan(childSpan)

  headers = new Headers(init?.headers)
  headers.set('sentry-trace', `${childSpan.traceId}-${childSpan.spanId}-1`)
    // downstream servers can join the same trace

  startedAt = Date.now()

  TRY
    response = await originalFetch(input, { ...init, headers })
    duration = Date.now() - startedAt

    logger.info('fetch %s %s → %d', [method, url, response.status], {
      'http.method':      method,
      'http.url':         url,
      'http.status_code': response.status,
      'http.duration_ms': duration,
    })

    RETURN response

  CATCH err
    logger.error('fetch %s %s failed: %s', [method, url, err.message], {
      'http.method': method,
      'http.url':    url,
      'error.type':  err.constructor.name,
    })
    THROW err   // re-throw so caller still sees the error

  FINALLY
    setActiveSpan(parentSpan)   // restore parent span after request completes
```

---

## 11. `src/integrations/xhr.ts` — XMLHttpRequest Instrumentation

### Purpose
Monkey-patch `XHR.prototype.open` and `XHR.prototype.send` to track requests made via XMLHttpRequest (older libraries, axios, etc.).

### Key mechanism
`open` and `send` are separate method calls on the same XHR instance. Use a `WeakMap<XHRInstance, Metadata>` to pass data from `open` to `send` without polluting the XHR object itself.

### Functions

**`patchXhr(): void`**
```
SSR GUARD: IF typeof window === 'undefined' → RETURN

IF already patched → RETURN

xhrMetaMap = new WeakMap()
  // WeakMap key = XHR instance, value = { method, url, startedAt }
  // GC-safe: entries are cleaned up automatically when XHR is garbage collected

originalOpen = XMLHttpRequest.prototype.open

REPLACE XMLHttpRequest.prototype.open with function(method, url, ...rest)
  xhrMetaMap.set(this, { method: method.toUpperCase(), url: String(url) })
  CALL originalOpen.call(this, method, url, ...rest)


originalSend = XMLHttpRequest.prototype.send

REPLACE XMLHttpRequest.prototype.send with function(body?)
  meta = xhrMetaMap.get(this)

  IF meta
    meta.startedAt = Date.now()

    LISTEN to this.addEventListener('loadend', function()
      duration   = Date.now() - meta.startedAt
      statusCode = this.status

      IF statusCode >= 400 OR statusCode === 0
        logger.error('xhr %s %s → %d', [meta.method, meta.url, statusCode], {
          'http.method':      meta.method,
          'http.url':         meta.url,
          'http.status_code': statusCode,
          'http.duration_ms': duration,
        })
      ELSE
        logger.info('xhr %s %s → %d', [meta.method, meta.url, statusCode], {
          'http.method':      meta.method,
          'http.url':         meta.url,
          'http.status_code': statusCode,
          'http.duration_ms': duration,
        })
    )

  CALL originalSend.call(this, body)
```

---

## 12. `src/integrations/navigation.ts` — SPA Navigation Tracking

### Purpose
Track React Router (and all other SPA router) page navigations by patching `history.pushState` and listening to `popstate`. Also logs page load performance metrics on initial load.

React Router v6 calls `history.pushState` internally — patching it covers React Router, Next.js router, Remix, and any other history-based router automatically.

### Functions

**`setupNavigation(): void`**
```
SSR GUARD: IF typeof window === 'undefined' → RETURN

LISTEN window.addEventListener('load', function()
  navEntry = performance.getEntriesByType('navigation')[0]

  logger.info('pageload %s', [window.location.pathname], {
    'navigation.type':          navEntry?.type,         // 'navigate', 'reload', 'back_forward'
    'navigation.duration_ms':   navEntry?.duration,
    'navigation.domComplete_ms': navEntry?.domComplete,
    'navigation.ttfb_ms':       navEntry?.responseStart,
    'navigation.fcp_ms':        getFCP(),               // First Contentful Paint
  })
)


originalPushState = history.pushState

REPLACE history.pushState with function(state, title, url?)
  CALL originalPushState.call(this, state, title, url)
  CALL onNavigate(String(url ?? window.location.pathname))


LISTEN window.addEventListener('popstate', function()
  CALL onNavigate(window.location.pathname)
  // popstate fires on browser back/forward button
)
```

**`onNavigate(url: string): void`** (internal)
```
previousSpan = getActiveSpan()

newSpan = {
  traceId:   previousSpan?.traceId ?? generateId(32),   // same trace as session
  spanId:    generateId(16),                             // new span for this page
  op:        'navigation',
  startedAt: Date.now()
}

setActiveSpan(newSpan)

logger.info('navigation → %s', [url], {
  'navigation.url':      url,
  'navigation.previous': document.referrer || previousSpan?.['navigation.url'],
})
```

**`getFCP(): number | undefined`** (internal)
```
entry = performance.getEntriesByName('first-contentful-paint')[0]
RETURN entry?.startTime
```

---

## 13. `src/components/ErrorBoundary.tsx` — React Error Boundary

### Purpose
Catch errors thrown during React component rendering (inside `render()`, lifecycle methods, constructor). These errors do NOT reach `window.onerror` — they are swallowed by React's reconciler. An Error Boundary is the only way to capture them.

This is a React class component — Error Boundaries can only be class components (React requirement: hooks cannot implement `componentDidCatch`).

### Props

```ts
interface ErrorBoundaryProps {
  children:     React.ReactNode
  fallback?:    React.ReactNode           // UI to show when an error is caught
  onError?:     (error: Error, info: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error:    Error | null
}
```

### Class definition

**`class ErrorBoundary extends React.Component`**

```
constructor(props)
  super(props)
  this.state = { hasError: false, error: null }


static getDerivedStateFromError(error: Error): ErrorBoundaryState
  // React calls this during render of a child that throws
  // Must be static — updates state so fallback UI is rendered
  RETURN { hasError: true, error }


componentDidCatch(error: Error, info: React.ErrorInfo): void
  // React calls this after the error is caught
  // info.componentStack is the React component tree stack (not a JS stack)
  // Use this for logging — do NOT setState here

  logger.fatal('React render error: %s', [error.message], {
    'error.type':            error.constructor.name,
    'error.component_stack': info.componentStack,
    'component.boundary':    this.constructor.name ?? 'ErrorBoundary',
  })
  // logger.fatal (severityNumber 21) also auto-captures JS stack frames

  IF this.props.onError
    CALL this.props.onError(error, info)    // let parent handle too


render(): React.ReactNode
  IF this.state.hasError
    IF this.props.fallback
      RETURN this.props.fallback
    RETURN <div>Something went wrong.</div>  // default fallback

  RETURN this.props.children
```

### Usage in consuming app

```tsx
import { ErrorBoundary } from '@internal/sdk-react'

function App() {
  return (
    <ErrorBoundary fallback={<p>Oops! Something went wrong.</p>}>
      <PaymentForm />
      <UserProfile />
    </ErrorBoundary>
  )
}
```

Multiple boundaries can be nested — inner boundary catches first, outer is fallback.

---

## 14. `src/hooks/useLogger.ts` — React Logger Hook

### Purpose
Wrap the base `logger` object in a React hook that automatically attaches `component.name` as an attribute to every log call. Consumer never has to manually pass the component name.

### Functions

**`useLogger(componentName: string): BoundLogger`**
```
RETURN useMemo(() => {
  RETURN {
    trace: (template, params?, attrs?) =>
      logger.trace(template, params, { 'component.name': componentName, ...attrs })

    debug: (template, params?, attrs?) =>
      logger.debug(template, params, { 'component.name': componentName, ...attrs })

    info:  (template, params?, attrs?) =>
      logger.info(template, params, { 'component.name': componentName, ...attrs })

    warn:  (template, params?, attrs?) =>
      logger.warn(template, params, { 'component.name': componentName, ...attrs })

    error: (template, params?, attrs?) =>
      logger.error(template, params, { 'component.name': componentName, ...attrs })

    fatal: (template, params?, attrs?) =>
      logger.fatal(template, params, { 'component.name': componentName, ...attrs })
  }
}, [componentName])
// useMemo: stable reference — recreate only if componentName changes
```

### Usage in consuming app

```tsx
import { useLogger } from '@internal/sdk-react'

function PaymentForm() {
  const log = useLogger('PaymentForm')

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await processPayment(formData)
      log.info('Payment submitted for %s', [formData.amount])
    } catch (err) {
      log.error('Payment failed: %s', [err.message], { 'payment.amount': formData.amount })
      // every log automatically gets { 'component.name': 'PaymentForm' }
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

---

## npm link Setup

### Step 1 — build the SDK
```bash
cd sdk-react/
npm install
npm run build        # compiles src/ → dist/
npm link             # registers @internal/sdk-react globally via symlink
```

### Step 2 — link in consuming React app
```bash
cd ../my-react-app/
npm link @internal/sdk-react
```

### Step 3 — set up dummy log endpoint
```bash
# minimal express server to receive logs
node -e "
const http = require('http')
http.createServer((req, res) => {
  let body = ''
  req.on('data', d => body += d)
  req.on('end', () => {
    console.log(JSON.parse(body))
    res.end('ok')
  })
}).listen(4000, () => console.log('log receiver on :4000'))
"
```

### Step 4 — initialise in app entry point

```tsx
// src/main.tsx (Vite) or src/index.tsx (CRA)
import React from 'react'
import ReactDOM from 'react-dom/client'
import { init } from '@internal/sdk-react'
import App from './App'

init({
  logEndpoint: 'http://localhost:4000/logs',
  appName:     'my-react-app',
  environment: 'development',
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### Dev workflow
```bash
# Terminal 1 — SDK: auto-recompile on change
cd sdk-react/ && npm run dev

# Terminal 2 — App: Vite HMR picks up changes automatically via symlink
cd my-react-app/ && npm run dev

# Terminal 3 — dummy log receiver
node log-server.js
```

---

## Data Flow Summary

```
init()
  ├── setActiveSpan({ op: 'pageload', traceId, spanId })   // initial span
  ├── setupGlobalErrors()    // window.onerror + onunhandledrejection
  ├── patchFetch()           // wraps window.fetch
  ├── patchXhr()             // wraps XHR.prototype.open/send
  └── setupNavigation()      // patches history.pushState + popstate

User clicks link → React Router calls history.pushState
  └── navigation.ts patch fires
        └── onNavigate()
              ├── setActiveSpan({ op: 'navigation', same traceId, new spanId })
              └── logger.info('navigation → /checkout') → captureLog → send POST

PaymentForm mounts → useLogger('PaymentForm')
  └── returns bound logger with component.name auto-attached

User submits form → fetch('/api/pay')
  └── fetch.ts patch fires
        ├── setActiveSpan(childSpan)
        ├── injects sentry-trace header
        ├── awaits response
        ├── logger.info/error(...) → captureLog → send POST
        └── setActiveSpan(parentSpan)   // restore

React render throws
  └── ErrorBoundary.componentDidCatch
        └── logger.fatal('React render error: %s', ...)
              └── captureLog
                    ├── captureFrames()    // new Error() stack trick
                    ├── getActiveSpan()    // trace_id, span_id from module-level state
                    ├── build attributes
                    └── transport.send()   // POST to http://localhost:4000/logs

window.onerror fires (non-render error)
  └── errors.ts handler
        └── logger.fatal(...)  → same captureLog pipeline
```

---

## What's different from the Browser SDK POC

| Concern | Browser SDK POC | sdk-react |
|---------|----------------|-----------|
| Transport | `writeToDom()` DOM panel + `sendBeacon` | `sendBeacon` POST to endpoint only — no DOM panel |
| React errors | not handled | `ErrorBoundary.componentDidCatch` |
| Component context | manual attributes | `useLogger('ComponentName')` hook auto-attaches |
| Package setup | no npm package | full `package.json`, `tsconfig`, `npm link` workflow |
| SSR safety | not guarded | all integrations have `typeof window === 'undefined'` guard |
