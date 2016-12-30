#!/usr/bin/env node
// to use this just run: node shell
var repl = require('repl');
var r = repl.start({ prompt: '> ', useGlobal: true });
r.on('exit', function () {
    console.log('Bye');
    process.exit();
});
