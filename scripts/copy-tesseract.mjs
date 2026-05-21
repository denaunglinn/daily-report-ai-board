import { cpSync } from 'fs'

const files = [
  ['node_modules/tesseract.js/dist/worker.min.js',              'public/tesseract-worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'public/tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm',    'public/tesseract-core-simd-lstm.wasm'],
]

for (const [src, dest] of files) {
  cpSync(src, dest)
  console.log(`  ✓ ${dest}`)
}
