const esbuild = require('esbuild')

let config

if (process.env.TARGET === 'dev') {
    config = {
        entryPoints: ['./src/index.js'],
        outfile: 'lib/index.js',
        bundle: true,
        minify: false,
        platform: 'browser',
        sourcemap: 'inline',
        target: 'es2020'
    }
} else {
    config = {
        entryPoints: ['./src/index.js'],
        outfile: 'lib/index.js',
        bundle: true,
        minify: true,
        platform: 'browser',
        sourcemap: false,
        target: 'es2020'
    }
}

esbuild.build(config).catch(() => process.exit(1))
