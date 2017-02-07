# textlint-rule-terminology

[![Build Status](https://travis-ci.org/sapegin/textlint-rule-terminology.svg)](https://travis-ci.org/sapegin/textlint-rule-terminology)
[![npm](https://img.shields.io/npm/v/textlint-rule-terminology.svg)](https://www.npmjs.com/package/textlint-rule-terminology)

[textlint](https://github.com/textlint/textlint) rule to check correct terms spelling.

## Installation

```shell
npm install textlint-rule-terminology
```

## Usage

```shell
textlint --format pretty-error --rule terminology Readme.md
```

## Configuration

By default the rule will check against my personal [terminology](./terms.json). You can change it in your `.textlintrc`:

```js
{
  "rules": {
    "terminology": {
      // List of terms
      "terms": {
        // Correct spelling: list of possible mistakes
        "frontend": ["front-end"],
        "site": ["website"]
      },
      // OR load terms from a file
      "terms": "~/terms.json",
      // OR load terms from npm
      "terms": "@johnsmith/terms"
    }
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
