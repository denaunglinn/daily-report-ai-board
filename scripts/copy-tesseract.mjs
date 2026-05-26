import { cpSync, readFileSync, writeFileSync } from 'fs'

const files = [
  ['node_modules/tesseract.js/dist/worker.min.js',              'public/tesseract-worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'public/tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm',    'public/tesseract-core-simd-lstm.wasm'],
]

for (const [src, dest] of files) {
  cpSync(src, dest)
  console.log(`  ✓ ${dest}`)
}

// Patch the worker to suppress harmless "Parameter not found" warnings that
// Tesseract's LSTM engine emits for legacy parameters it no longer uses.
const workerPath = 'public/tesseract-worker.min.js'
const patch = [
  ';(function(){',
  'var _w=self.console.warn.bind(self.console);',
  'var _e=self.console.error.bind(self.console);',
  'var _NOISE=/^Warning: Parameter not found:/;',
  'self.console.warn=function(){if(typeof arguments[0]==="string"&&_NOISE.test(arguments[0]))return;_w.apply(null,arguments);};',
  'self.console.error=function(){if(typeof arguments[0]==="string"&&_NOISE.test(arguments[0]))return;_e.apply(null,arguments);};',
  '})();',
].join('')

const original = readFileSync(workerPath, 'utf8')
writeFileSync(workerPath, patch + '\n' + original, 'utf8')
console.log('  ✓ patched tesseract-worker.min.js (suppressed Parameter not found warnings)')
