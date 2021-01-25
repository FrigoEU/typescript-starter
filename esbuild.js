// const http = require("http");
// const fs = require('fs');
// const path = require("path");

const esbuild = require("esbuild");
// const myArgs = process.argv.slice(2);

const buildServerOptions = {
  entryPoints: ["src/index.tsx"],
  define: {"process.env.NODE_ENV": "'development'"},
  bundle: true,
  jsxFactory: 'h',
  sourcemap: true,
  external: ["pg-native"],
  loader: {
    '.png': 'file',
    '.jpg': 'file'
  },
  platform: "node",
  outdir: 'out/server'
};

// One option would be to have every page be a seperate ts/tsx file (which is anyway a good idea).
// We then add each of these pages as an entrypoint here and set splitting = true.
// Serverside code or html files/templates should then only need to import that single .js file.
// This would give us a pretty optimal clientside loading strategy, as long as we don't do any offline support.
const buildClientOptions = {
  entryPoints: ["src/client/mycomponent.tsx"],
  define: { "process.env.NODE_ENV": "'development'" },
  bundle: true,
  jsxFactory: 'h',
  sourcemap: true,
  loader: {
    '.png': 'file',
    '.jpg': 'file'
  },
  platform: "browser",
  outdir: 'out/browser'
};

function log(a){
  console.log(a);
}

esbuild.build(buildServerOptions).catch(() => process.exit(1));
esbuild.build(buildClientOptions).catch(() => process.exit(1));
