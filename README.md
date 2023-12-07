# serve

Serve files from a folder with custom rules.

```sh
node bin.js --root path/to/dir --port 8000
```

Block access for some files

```json
// .serverc.json
{
  "match": "**/*.pdf", // https://www.npmjs.com/package/minimatch
  "block": true
}
```

Block access to a folder

```json
// path/to/sub/dir/.serverc.json
{
  "block": true
}
```

Complex rules are possible

```json
// path/to/sub/dir/.serverc.json
[
  {
    "match": ["**/*.cpp", "**/*.js"],
    "since": 1700000000000,
    "prior": 1720000000000
  },
  {
    "match": ["**/*.(py|pyc)"],
    "block": true
  }
]
```
