const esbuild = require('esbuild')

esbuild.build({
    entryPoints: ['./src/index.js'],
    outfile: 'lib/index.js',
    bundle: true,
    minify: true,
    platform: 'browser',
    sourcemap: 'external',
    target: 'es2020'
}).catch(() => process.exit(1))
