## 0.1.4

- Allow `meta` property on `option`:

  ```ts
  parse<{ description: string }>([
    { name: "foo", type: String, meta: { description: "foo flag" } },
  ])
  ```

  This is useful if you want to build a help message output options, you can pass additional properties to `meta` to store some information, like description.
