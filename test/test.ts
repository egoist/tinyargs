import test from "ava"
import { parse } from "../src"

test("args", (t) => {
  t.throws(
    () => {
      parse(["--foo", "--bar", "123"], [])
    },
    { message: /unknown flag/ },
  )

  t.deepEqual(
    parse(
      ["--foo", "--bar", "123"],
      [
        { name: "foo", type: Boolean },
        { name: "bar", type: Number },
      ],
    ),
    { foo: true, bar: 123, _: [] },
  )

  t.throws(
    () => {
      parse(["--foo", "123"], [{ name: "foo", type: Boolean }])
    },
    { message: /unknown positional argument: 123/ },
  )

  t.deepEqual(
    parse(
      ["--own-arg", "1", "run", "build", "--bar", "123"],
      [
        { name: "ownArg", flags: ["own-arg"], type: Number },
        { name: "command", type: String, positional: true },
        { name: "script", type: String, positional: true, stop: true },
      ],
    ),
    { ownArg: 1, command: "run", script: "build", _: ["--bar", "123"] },
  )
})

test("multiple: multiple boolean flags", (t) => {
  t.deepEqual(
    parse(
      ["--foo", "--foo", "--foo"],
      [{ name: "foo", type: Boolean, multiple: true }],
    ),
    { foo: [true, true, true], _: [] },
  )
})

test("multiple: multiple string flags", (t) => {
  t.deepEqual(
    parse(
      ["--foo", "1", "--foo", "2", "--foo", "3"],
      [{ name: "foo", type: String, multiple: true }],
    ),
    { foo: ["1", "2", "3"], _: [] },
  )
})

test("multiple: multiple number flags", (t) => {
  t.deepEqual(
    parse(
      ["--foo", "1", "--foo", "2", "--foo", "3"],
      [{ name: "foo", type: Number, multiple: true }],
    ),
    { foo: [1, 2, 3], _: [] },
  )
})

test("multiple: multiple positional args", (t) => {
  t.deepEqual(
    parse(
      ["1", "2", "3", "-f"],
      [
        { name: "foo", type: String, multiple: true, positional: true },
        { name: "f", type: Boolean },
      ],
    ),
    { foo: ["1", "2", "3"], f: true, _: [] },
  )

  t.deepEqual(
    parse(
      ["1", "2", "3", "-f"],
      [
        {
          name: "foo",
          type: String,
          multiple: "include-flags",
          positional: true,
        },
      ],
    ),
    { foo: ["1", "2", "3", "-f"], _: [] },
  )
})

test("multiple: multiple positional args should stop when a flag appears", (t) => {
  t.deepEqual(
    parse(
      ["1", "2", "--bar", "3"],
      [
        { name: "foo", type: String, multiple: true, positional: true },
        { name: "bar", type: String },
      ],
    ),
    { foo: ["1", "2"], bar: "3", _: [] },
  )
})

test("when: add flag when the command is build", (t) => {
  t.throws(
    () => {
      parse(
        ["not-build", "--foo"],
        [
          { name: "command", type: String, positional: true },
          {
            name: "foo",
            type: Boolean,
            when: (parsed) => parsed.command === "build",
          },
        ],
      )
    },
    { message: /unknown flag: --foo/ },
  )

  t.notThrows(() => {
    parse(
      ["build", "--foo"],
      [
        { name: "command", type: String, positional: true },
        {
          name: "foo",
          type: Boolean,
          when: (parsed) => parsed.command === "build",
        },
      ],
    )
  })
})

test("when: only accept script args when command is run", (t) => {
  t.throws(
    () => {
      parse(
        ["test", "build"],
        [
          { name: "command", type: String, positional: true },
          {
            name: "script",
            type: String,
            positional: true,
            when: (parsed) => parsed.command === "run",
          },
        ],
      )
    },
    { message: /unknown positional argument: build/ },
  )

  t.deepEqual(
    parse(
      ["run", "build"],
      [
        { name: "command", type: String, positional: true },
        {
          name: "script",
          type: String,
          positional: true,
          when: (parsed) => parsed.command === "run",
        },
      ],
    ),
    { command: "run", script: "build", _: [] },
  )
})

test("option value: required by default", (t) => {
  t.throws(
    () => {
      parse(["--foo"], [{ name: "foo", type: String }])
    },
    { message: /missing value for --foo/ },
  )
})

test("option value: optional", (t) => {
  t.deepEqual(
    parse(["--foo"], [{ name: "foo", type: String, optionalValue: true }]),
    {
      foo: true,
      _: [],
    },
  )
})

test("positional arg: required by default", (t) => {
  t.throws(
    () => {
      parse([], [{ name: "command", type: String, positional: true }])
    },
    { message: /missing positional argument: command/ },
  )
})

test("positional arg: optional", (t) => {
  t.deepEqual(
    parse(
      [],
      [
        {
          name: "command",
          type: String,
          optionalValue: true,
          positional: true,
        },
      ],
    ),
    {
      _: [],
    },
  )
})

test("stop: use with flag", (t) => {
  t.deepEqual(
    parse(["--foo", "--bar"], [{ name: "foo", type: Boolean, stop: true }]),
    { foo: true, _: ["--bar"] },
  )
})

test("using = as separator", (t) => {
  t.deepEqual(parse(["--foo=bar"], [{ name: "foo", type: String }]), {
    foo: "bar",
    _: [],
  })
})

test("combines short flags", (t) => {
  t.deepEqual(
    parse(
      ["-abC", "1"],
      [
        { name: "a", type: Boolean },
        { name: "b", type: Boolean },
        { name: "C", type: String },
      ],
    ),
    {
      a: true,
      b: true,
      C: "1",
      _: [],
    },
  )
})

test(`don't check skipped positional arguments`, (t) => {
  t.deepEqual(
    parse(
      ["hey"],
      [
        { name: "command", positional: true, type: String },
        {
          name: "script",
          positional: true,
          type: String,
          when: (cli) => cli.command === "run",
        },
      ],
    ),
    { command: "hey", _: [] },
  )
})
