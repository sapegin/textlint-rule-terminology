# textlint-rule-terminology

[![textlint fixable rule](https://img.shields.io/badge/textlint-fixable-green.svg?style=social)](https://textlint.github.io/)
[![Build Status](https://travis-ci.org/sapegin/textlint-rule-terminology.svg)](https://travis-ci.org/sapegin/textlint-rule-terminology)
[![npm](https://img.shields.io/npm/v/textlint-rule-terminology.svg)](https://www.npmjs.com/package/textlint-rule-terminology)

[textlint](https://github.com/textlint/textlint) rule to check and fix term spelling in your tech writing.

For example:

* Javascript → JavaScript
* NPM → npm
* front-end → frontend
* website → site
* Internet → internet

## Installation

```shell
npm install textlint-rule-terminology
```

## Usage

```shell
textlint --fix --rule terminology Readme.md
```

## Configuration

By default the rule will check against my personal [terminology](./terms.json). You can change it in your `.textlintrc`:

```js
{
  "rules": {
    "defaultTerms": true,
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
      // OR load terms from a file
      "terms": "~/terms.json",
      // OR load terms from npm
      "terms": "@johnsmith/terms"
    }
    // Syntax elements to skip. Overrides the default
    "skip": ["Blockquote"]
  }
}
```

Read more about [configuring textlint](https://github.com/textlint/textlint/blob/master/docs/configuring.md).

## Changelog

The changelog can be found on the [Releases page](https://github.com/sapegin/textlint-rule-terminology/releases).

## Contributing

Everyone is welcome to contribute. Please take a moment to review the [contributing guidelines](Contributing.md).

## Authors and license

[Artem Sapegin](http://sapegin.me) and [contributors](https://github.com/sapegin/textlint-rule-terminology/graphs/contributors).

MIT License, see the included [License.md](License.md) file.
