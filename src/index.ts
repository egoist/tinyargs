export type Option = {
  /**
   * The flag or positional argument's name
   *
   * For example, `name: 'file'` will capture the value of flag `--file`
   */
  name: string
  /**
   * By default we only capture flags that match the option `name`
   * But you can use `alias` to capture flags that match any of the aliases
   */
  flags?: string[]
  /**
   * Option type
   *
   * We use the function to coerce the value
   */
  type: OptionSimpleType
  /**
   * Allow multiple flags or positional arguments
   *
   * For flags, this means that the flag can be repeated.
   * @example
   * ```
   * $ node cli.js --foo --foo --foo
   * {foo: [true, true, true]}
   * $ node cli.js --foo 1 --foo 2 --foo 3
   * {foo: ['1', '2', '3']}
   * ```
   *
   * For positional arguments, you can provide multiple values.
   * It only captures non-flag value (not starting with a dash `-`) by default
   * but you can set it to `include-flags` to capture all values
   * @example
   * ```
   * $ node cli.js a b c
   * {some_optiona: ['a', 'b', 'c']}
   * ```
   */
  multiple?: boolean | "include-flags"
  /**
   * Mark this optional as a positional argument
   */
  positional?: boolean
  /**
   * Stop parsing remaining arguments after current option
   *
   * The remaining arguments will be added to the `_` key
   */
  stop?: boolean
  /**
   * Allow optional value
   *
   * For a non-boolean flag, this means that the flag value can be omitted
   * @example
   * ```bash
   * node cli.js --config
   * # `config` will be `true` instead of throwing an error
   * ```
   *
   * For a positional argument, this means it could be `undefined` in the returned object
   */
  optionalValue?: boolean
  /**
   * Only add this option if this function returns true
   *
   * Already parsed options will be passed to the function
   */
  when?: (parsed: Parsed) => boolean
}

type OptionSimpleType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ((value: string) => any)

const pushOrSet = (obj: Record<string, any>, key: string, value: any) => {
  if (Array.isArray(obj[key])) {
    obj[key].push(value)
  } else {
    obj[key] = value
  }
}

export type Parsed = { _: string[]; [key: string]: any }

const parseFlag = (
  parsed: Parsed,
  args: string[],
  currentIndex: number,
  opt: Option,
  flag: string,
) => {
  if (opt.type === Boolean) {
    pushOrSet(parsed, opt.name, true)
  } else {
    const nextValue = args[++currentIndex]
    if (nextValue === undefined) {
      if (opt.optionalValue) {
        pushOrSet(parsed, opt.name, true)
      } else {
        throw new Error(`missing value for ${flag}`)
      }
    } else {
      pushOrSet(parsed, opt.name, opt.type(nextValue))
    }
  }
  return currentIndex
}

const parsePositional = (
  parsed: Parsed,
  args: string[],
  currentIndex: number,
  opt: Option,
) => {
  if (!opt.multiple) {
    parsed[opt.name] = opt.type(args[currentIndex])
    return currentIndex
  }

  const values: (string | number | boolean)[] = [opt.type(args[currentIndex])]

  for (let i = currentIndex + 1; i < args.length; i++) {
    const value = args[i]
    if (value && value[0] === "-" && opt.multiple !== "include-flags") {
      break
    } else if (value) {
      currentIndex += 1
      values.push(opt.type(value))
    }
  }

  parsed[opt.name] = values
  return currentIndex
}

/**
 * Parse command line arguments with give option config
 *
 * Not that if you're using `process.argv`, you should always omit the first two elements,
 * i.e. pass `process.argv.slice(2)` to this function
 */
export const parse = (args: string[], options: Option[]) => {
  const parsed: Parsed = { _: [] }
  let stopped = false

  for (let i = 0; i < args.length; i++) {
    const flag = args[i]
    const flagName = flag.replace(/^-{1,2}/, "")
    if (stopped) {
      parsed._.push(flag)
      continue
    }

    if (flag.startsWith("-")) {
      const opt = options.find(
        (o) =>
          !o.positional &&
          (o.name === flagName || o.flags?.includes(flagName)) &&
          (!o.when || o.when(parsed)),
      )
      if (opt) {
        if (opt.multiple) {
          parsed[opt.name] = parsed[opt.name] || []
        }
        i = parseFlag(parsed, args, i, opt, flag)
        if (opt.stop) {
          stopped = true
        }
      } else {
        throw new Error(`unknown flag: ${flag}`)
      }
    } else {
      const opt = options.find(
        (o) =>
          o.positional &&
          parsed[o.name] === undefined &&
          (!o.when || o.when(parsed)),
      )
      if (opt) {
        i = parsePositional(parsed, args, i, opt)
        if (opt.stop) {
          stopped = true
        }
      } else {
        throw new Error(`unknown positional argument: ${flag}`)
      }
    }
  }

  // check require positional arguments
  for (const opt of options) {
    if (
      opt.positional &&
      !opt.optionalValue &&
      parsed[opt.name] === undefined
    ) {
      throw new Error(`missing positional argument: ${opt.name}`)
    }
  }

  return parsed
}
