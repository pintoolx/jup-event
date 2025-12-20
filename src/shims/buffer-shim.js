// Buffer shim for esbuild inject
import { Buffer } from 'buffer'

globalThis.Buffer = Buffer
window.Buffer = Buffer
