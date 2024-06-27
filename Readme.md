# textlint-rule-terminology

[![textlint fixable rule](https://img.shields.io/badge/textlint-fixable-green.svg?style=social)](https://textlint.github.io/) [![npm](https://img.shields.io/npm/v/textlint-rule-terminology.svg)](https://www.npmjs.com/package/textlint-rule-terminology) [![Node.js CI status](https://github.com/sapegin/textlint-rule-terminology/workflows/Node.js%20CI/badge.svg)](https://github.com/sapegin/textlint-rule-terminology/actions)

[Textlint](https://github.com/textlint/textlint) rule to check and fix terms, brands and technologies spelling in your tech writing in English.

For example:

- Javascript → JavaScript
- NPM → npm
- front-end → frontend
- website → site
- Internet → internet

(You can customize the rules as you wish.)

![](https://d3vv6lp55qjaqc.cloudfront.net/items/1p0s3e2p1U1m1r3N2Q41/terminology.png)

## Installation

```shell
npm install textlint-rule-terminology
```

## Usage

```shell
textlint --fix --rule terminology Readme.md
```

## Configuration

You can configure the rule in your `.textlintrc`:

```js
{
  "rules": {
    "terminology": {
      // Your options here
    }
  }
}
```

Read more about [configuring textlint](https://github.com/textlint/textlint/blob/master/docs/configuring.md).

### `defaultTerms` (default: `true`)

Whether to load the [default replacements (terms)](./terms.jsonc). Example:

```js
{
  "rules": {
    "terminology": {
      // Don't load default replacements
      "defaultTerms": false,
    }
  }
}
```

### `skip` (default `['BlockQuote']`)

Syntax elements to skip. By default skips blockquotes. Example:

```js
{
  "rules": {
    "terminology": {
      // Don't check terms inside links
      "skip": ["Link"],
    }
  }
}
```

See [all available element types](https://github.com/textlint/textlint/blob/master/packages/%40textlint/ast-node-types/src/ASTNodeTypes.ts).

### `terms`

Additional replacements.

Could be an array of replacements:

```js
{
  "rules": {
    "terminology": {
      // List of terms
      "terms": [
        // Exact spelling including the case
        "JavaScript",
        "ESLint",
        "Sass",
        "Less",
        "npm",
        // RegExp (case-insensitive) → replacement
        ["front[- ]end(\\w*)", "frontend$1"],
        ["back[- ]end(\\w*)", "backend$1"],
        ["web[- ]?site(s?)", "site$1"],
        ["hot[- ]key", "hotkey"],
        ["repo\\b", "repository"],
        ["CLI tool(s?)", "command line tool$1"],
        ["build system(s?)", "build tool$1"],
        ["id['’]?s", "IDs"],
        ["(\\w+[^.?!]\\)? )webpack", "$1webpack"],
        ["(\\w+[^.?!]\\)? )internet", "$internet"]
      ],
    }
  }
}
```

A path to a JSON file:

```js
{
  "rules": {
    "terminology": {
      // Load terms from a file
      "terms": "~/terms.jsonc",
    }
  }
}
```

Or an npm module:

```js
{
  "rules": {
    "terminology": {
      // Load terms from npm
      "terms": "@chucknorris/terms",
    }
  }
}
```

Check out [the default replacements](./terms.jsonc).

### `exclude`

If you don’t like any of [the default replacements](./terms.jsonc), you can _exclude_ them. For example, to exclude these entries:

```js
// terms.jsonc
[
  'JavaScript',
  'API',
  ['V[ -]?S[ -]?Code', 'Visual Studio Code'],
  ['walk-through', 'walkthrough'],
  ['(?<![\\.-])css\\b', 'CSS']
];
```

You need to copy the exact entry (for array, just the first element) to the `exclude` option of the `terminology` rule in your Textlint config:

```js
{
  "rules": {
    "terminology": {
      // Excludes terms
      "exclude": [
        // Simple replacements, the casing should match terms.jsonc entry
        "JavaScript",
        "API",
        // Complex replacements, put only the first array element exactly as
        // in terms.jsonc
        "V[ -]?S[ -]?Code",
        "walk-through",
        "(?<![\\.-])css\\b"
      ]
    }
  }
}
```

## Tips & tricks

Use [textlint-filter-rule-comments](https://github.com/textlint/textlint-filter-rule-comments) to disable terminology check for particular paragraphs:

```markdown
<!-- textlint-disable terminology -->

Oh my javascript!

<!-- textlint-enable -->
```

## Other textlint rules

- [textlint-rule-apostrophe](https://github.com/sapegin/textlint-rule-apostrophe) — correct apostrophe usage
- [textlint-rule-diacritics](https://github.com/sapegin/textlint-rule-diacritics) — words with diacritics
- [textlint-rule-quotes](https://github.com/sapegin/textlint-rule-quotes) — correct quotes usage
- [textlint-rule-stop-words](https://github.com/sapegin/textlint-rule-stop-words) — filler words, buzzwords and clichés

## Change log

The change log can be found on the [Releases page](https://github.com/sapegin/textlint-rule-terminology/releases).

## Contributing

Bug fixes are welcome, but not new features. Please take a moment to review the [contributing guidelines](Contributing.md).

## Sponsoring

This software has been developed with lots of coffee, buy me one more cup to keep it going.

<a href="https://www.buymeacoffee.com/sapegin" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/lato-orange.png" alt="Buy Me A Coffee" height="51" width="217" ></a>

## Authors and license

[Artem Sapegin](https://sapegin.me) and [contributors](https://github.com/sapegin/textlint-rule-terminology/graphs/contributors).

MIT License, see the included [License.md](License.md) file. Also see the [project status](https://github.com/sapegin/textlint-rule-terminology/discussions/65).
