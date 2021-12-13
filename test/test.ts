import { test } from "uvu"
import assert from "uvu/assert"
import { parse } from "../src"

test("args", () => {
  assert.throws(() => {
    parse(["--foo", "--bar", "123"], [])
  }, /unknown flag/)

  assert.equal(
    parse(
      ["--foo", "--bar", "123"],
      [
        { name: "foo", type: Boolean },
        { name: "bar", type: Number },
      ],
    ),
    { foo: true, bar: 123, _: [] },
  )

  assert.throws(() => {
    parse(["--foo", "123"], [{ name: "foo", type: Boolean }])
  }, /unknown positional argument: 123/)

  assert.equal(
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

test("multiple: multiple boolean flags", () => {
  assert.equal(
    parse(
      ["--foo", "--foo", "--foo"],
      [{ name: "foo", type: Boolean, multiple: true }],
    ),
    { foo: [true, true, true], _: [] },
  )
})

test("multiple: multiple string flags", () => {
  assert.equal(
    parse(
      ["--foo", "1", "--foo", "2", "--foo", "3"],
      [{ name: "foo", type: String, multiple: true }],
    ),
    { foo: ["1", "2", "3"], _: [] },
  )
})

test("multiple: multiple number flags", () => {
  assert.equal(
    parse(
      ["--foo", "1", "--foo", "2", "--foo", "3"],
      [{ name: "foo", type: Number, multiple: true }],
    ),
    { foo: [1, 2, 3], _: [] },
  )
})

test("multiple: multiple positional args", () => {
  assert.equal(
    parse(
      ["1", "2", "3", "-f"],
      [
        { name: "foo", type: String, multiple: true, positional: true },
        { name: "f", type: Boolean },
      ],
    ),
    { foo: ["1", "2", "3"], f: true, _: [] },
  )

  assert.equal(
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

test("multiple: multiple positional args should stop when a flag appears", () => {
  assert.equal(
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

test("when: add flag when the command is build", () => {
  assert.throws(() => {
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
  }, /unknown flag: --foo/)

  assert.not.throws(() => {
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

test("when: only accept script args when command is run", () => {
  assert.throws(() => {
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
  }, /unknown positional argument: build/)

  assert.equal(
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

test("option value: required by default", () => {
  assert.throws(() => {
    parse(["--foo"], [{ name: "foo", type: String }])
  }, /missing value for --foo/)
})

test("option value: optional", () => {
  assert.equal(
    parse(["--foo"], [{ name: "foo", type: String, optionalValue: true }]),
    {
      foo: true,
      _: [],
    },
  )
})

test("positional arg: required by default", () => {
  assert.throws(() => {
    parse([], [{ name: "command", type: String, positional: true }])
  }, /missing positional argument: command/)
})

test("positional arg: optional", () => {
  assert.equal(
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

test("stop: use with flag", () => {
  assert.equal(
    parse(["--foo", "--bar"], [{ name: "foo", type: Boolean, stop: true }]),
    { foo: true, _: ["--bar"] },
  )
})

test("using = as separator", () => {
  assert.equal(parse(["--foo=bar"], [{ name: "foo", type: String }]), {
    foo: "bar",
    _: [],
  })
})

test("combines short flags", () => {
  assert.equal(
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

test.run()
