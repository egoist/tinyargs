**💛 You can help the author become a full-time open-source maintainer by [sponsoring him on GitHub](https://github.com/sponsors/egoist).**

---

# tinyargs

[![npm version](https://badgen.net/npm/v/tinyargs)](https://npm.im/tinyargs) [![npm downloads](https://badgen.net/npm/dm/tinyargs)](https://npm.im/tinyargs) [![Coverage Status](https://coveralls.io/repos/github/egoist/tinyargs/badge.svg?branch=main)](https://coveralls.io/github/egoist/tinyargs?branch=main)

A tiny and flexible command-line argument parser for Node.js and Deno.

## Features

- Support combined short flags, `-abc foo` is expanded to `-a -b -c foo`
- Support using equal sign to specify argument value, `-c=config.js` is expanded to `-c config.js`
- Support positional arguments like `your-cli foo bar`
- Support collecting trailing arguments
- Support sub commands

## Install

```bash
npm i tinyargs
```

[Deno](https://deno.land) users:

```ts
import { parse } from "https://deno.land/x/tinyargs/mod.ts"
```

## Examples

### Simple Example

```ts
import { parse } from "tinyargs"

const cli = parse(process.argv.slice(2), [
  { name: "help", flags: ["h"], type: Boolean, stop: true },
  { name: "version", flags: ["v"], type: Boolean, stop: true },
  { name: "files", type: String, positional: true, multiple: true },
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

If `-h, --help` or `-v, --version` appears, the remaining arguments are not parsed, since we added `stop: true` to the option.

By default all options and positional arguments are required to have a value, if you add a string option named `foo` but it's used like `--foo --bar`, it will throw an error. This can be customized by setting `optionalValue: true`, which in this case would give `foo` a default value of `true` instead.

### Sub Commands

Create a CLI with two sub commands: (<small>_We use `<>` and `[]` to denote cli arguments in the docs, `<>` means it's required, `[]` means it's optional._</small>)

- `run <script> [args...]`: like `yarn run` or `npm run`, run a script and collect trailing arguments so that you can pass them to the script later.
- `download <url>`: download from a url.

```ts
const cli = parse(process.argv.slice(2), [
  { name: "command", type: String, positional: true },
  {
    name: "script",
    type: String,
    positional: true,
    when: (cli) => cli.command === "run",
    stop: true,
  },
  {
    name: "url",
    type: String,
    positional: true,
    when: (cli) => cli.command === "download",
  },
])

if (cli.command === "run") {
  console.log(`...running ${cli.script} with forwarded arguments ${cli._}`)
} else if (cli.command === "download") {
  console.log(`...downloading ${cli.url}`)
} else {
  console.log(`...unknown command ${cli.command}`)
}
```

## Guide

### Flags

Define a flag that could be used as `your-cli --file <value>`, only `name` and `type` are required:

```ts
parse(process.argv.slice(2), [{ name: "file", type: String }])
```

### Positional Arguments

Define a positional argument that could be used as `your-cli <file>`, by setting `positional: true`:

```ts
parse(process.argv.slice(2), [{ name: "file", type: String, positional: true }])
```

### Repeated / Multiple Flags and Positional Arguments

Flags can be repeated if you set `multiple: true`:

```ts
parse(process.argv.slice(2), [{ name: "file", type: String, multiple: true }])
```

Now your cli can be used as `your-cli --file a.js --file b.js`, the resulting object will look like: `{ file: [ 'a.js', 'b.js' ] }`.

Positional arguments work in a similar fashion:

```ts
parse(process.argv.slice(2), [
  { name: "file", type: String, positional: true, multiple: true },
])
```

Now you can do `your-cli a.js b.js`, the resulting object will look like: `{ file: [ 'a.js', 'b.js' ] }`.

Note that you can't have two `multiple` `poitional` arguments in the same command, because the first one will collect all positional arguments.

### Collecting Trailing Arguments

There're two way, first is to use the `stop` option, which will stop parsing arguments after the option, and arguments beyond that point will be collected under `_` in the returned object:

```ts
const cli = parse(
  ["--foo", "bar", "baz", "--some-flag"],
  [{ name: "foo", type: Boolean, stop: true }],
)

console.log(cli)
// { foo: true, _: [ 'bar', 'baz', '--some-flag' ] }
```

The second way is to use `positional: true` with `multiple: 'include-flags'`, which will collect trailing arguments into the specific option:

```ts
const cli = parse(
  ["--foo", "bar", "baz", "--some-flag"],
  [
    { name: "foo", type: Boolean },
    {
      name: "args",
      type: String,
      positional: true,
      multiple: "include-flags",
    },
  ],
)

console.log(cli)
// { foo: true, args: [ 'bar', 'baz', '--some-flag' ] }
```

## API Reference

https://www.jsdocs.io/package/tinyargs

## Sponsors

[![sponsors](https://sponsors-images.egoist.sh/sponsors.svg)](https://github.com/sponsors/egoist)

## License

MIT &copy; [EGOIST](https://github.com/sponsors/egoist)
