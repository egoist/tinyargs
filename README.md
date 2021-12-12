**💛 You can help the author become a full-time open-source maintainer by [sponsoring him on GitHub](https://github.com/sponsors/egoist).**

---

# tinyargs

[![npm version](https://badgen.net/npm/v/tinyargs)](https://npm.im/tinyargs) [![npm downloads](https://badgen.net/npm/dm/tinyargs)](https://npm.im/tinyargs)

A tiny and flexible command-line argument parser for Node.js and Deno.

## Install

```bash
npm i tinyargs
```

[Deno](https://deno.land) users:

```ts
import { parse } from "https://unpkg.com/tinyargs/mod.ts"
```

## Usage

### CLI example

```ts
import { parse } from "tinyargs"

const cli = parse(process.argv.slice(2), [
  { name: "help", flags: ["h"], type: Boolean, stop: true },
  { name: "version", flags: ["v"], type: Boolean, stop: true },
  { name: "files", type: String, positional, multiple: true },
])

if (cli.help) {
  console.log(`...your help message`)
  process.exit()
}

if (cli.version) {
  console.log(`...version number`)
  process.exit()
}

console.log(cli.files)
```

Run this cli:

```bash
$ node cli.js -h
...your help message

$ node cli.js -v
...version number

$ node cli.js foo.js bar.js
[ 'foo.js', 'bar.js' ]

$ node cli.js
error: missing positional argument: files
```

By default all options and positional arguments are required to have a value, if you add an string option named `foo` but it's used like `--foo --bar`, it will throw an error. This is be customized with the `optionalValue: true` option, which in this case would give `foo` a default value of `true` instead.

### Sub Commands

Create a CLI with two sub command:

- `run script [args...]`: like `yarn run` or `npm run`, run a script and collect remaining arguments so that you can pass them to the script later.
- `download <url>`: download from a url.

```ts
const cli = parse(process.argv.slice(2), [
  { name: "command", type: String, positional: true },
  {
    name: "script",
    type: String,
    positional: true,
    when: (cli) => cli.command === "run",
  },
  {
    name: "args",
    type: String,
    positional: true,
    multiple: "include-flags",
    optionalValue: true,
    when: (cli) => cli.command === "run",
  },
  {
    name: "url",
    type: String,
    positional: true,
    when: (cli) => cli.command === "download",
  },
])

if (cli.command === "run") {
  console.log(`...running ${cli.script} with ${cli.args}`)
} else if (cli.command === "download") {
  console.log(`...downloading ${cli.url}`)
} else {
  console.log(`...unknown command ${cli.command}`)
}
```

## API Reference

https://www.jsdocs.io/package/tinyargs

## Sponsors

[![sponsors](https://sponsors-images.egoist.sh/sponsors.svg)](https://github.com/sponsors/egoist)

## License

MIT &copy; [EGOIST](https://github.com/sponsors/egoist)
