import { describe, test, expect } from 'vitest';
import TextLintTester from 'textlint-tester';
import rule, {
  getTerms,
  findWord,
  getMultipleWordRegExp,
  getExactMatchRegExp,
  getAdvancedRegExp,
  getReplacement,
} from './index';

const tester = new TextLintTester();

describe('getTerms', () => {
  test('should load default terms', () => {
    const result = getTerms(true, [], []);
    expect(result).toBeTruthy();
    expect(result?.[0]).toBe('Airbnb');
  });

  test('should load user terms', () => {
    const result = getTerms(false, ['coffee'], []);
    expect(result).toBeTruthy();
    expect(result).not.toContain('Airbnb');
    expect(result).toContain('coffee');
  });

  test('should append user terms to defaults', () => {
    const result = getTerms(true, ['coffee'], []);
    expect(result).toBeTruthy();
    expect(result).toContain('Airbnb');
    expect(result).toContain('coffee');
  });

  test('should load user terms from a file', () => {
    const result = getTerms(false, '../test/terms.json', []);
    expect(result).toBeTruthy();
    expect(result).not.toContain('Airbnb');
    expect(result?.[0]).toContain('pizza');
  });

  test('should remove the excluded terms', () => {
    const result = getTerms(true, ['coffee', 'mocha'], ['CSS', 'coffee']);
    expect(result).toBeTruthy();
    expect(result).not.toContain('CSS');
    expect(result).not.toContain('coffee');
    expect(result).toContain('mocha');
    expect(
      result.some((term) => Array.isArray(term) && term[1] === 'Node.js')
    ).toBe(true);
  });

  test('should remove the excluded terms (defined as Array)', () => {
    const result = getTerms(true, [], ['Node[ .]?js']);
    expect(result).toBeTruthy();
    expect(
      result.some((term) => Array.isArray(term) && term[1] === 'Node.js')
    ).toBe(false);
  });
});

describe('findWord', () => {
  test('should find a word in an array ignoring the case', () => {
    const result = findWord(['pasta', 'piZZa', 'coffee'], 'Pizza');
    expect(result).toBe('piZZa');
  });
});

describe('getMultipleWordRegExp', () => {
  const variants = ['JavaScript', 'webpack'];

  test('should match a pattern as a full word', () => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      'My JavaScript is good'
    );
    expect(result?.[0]).toBe('JavaScript');
  });

  test('should not match a pattern in the middle of a word', () => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      'Foo superwebpacky bar'
    );
    expect(result).toBeFalsy();
  });

  test('should not match a pattern at the beginning of a string', () => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      'webpack bar'
    );
    expect(result).toBeTruthy();
    expect(result?.[0]).toBe('webpack');
  });

  test('should not match a pattern at the end of a string', () => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      'foo webpack'
    );
    expect(result).toBeTruthy();
    expect(result?.[0]).toBe('webpack');
  });

  test('should not match a pattern at the beginning of a word with a hyphen', () => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      'Foo webpack-ish bar'
    );
    expect(result).toBeFalsy();
  });

  test('should not match a pattern in at the end of a word with a hyphen', () => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      'Foo uber-webpack bar'
    );
    expect(result).toBeFalsy();
  });

  test('should not match a pattern in at the middle of a word with hyphens', () => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      'Foo uber-webpack-ish bar'
    );
    expect(result).toBeFalsy();
  });

  test('should match a pattern at the end of a sentence', () => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      'My javascript.'
    );
    expect(result).toBeTruthy();
    expect(result?.[0]).toBe('javascript');
  });

  test('should match a pattern at the end of a sentence in the middle of a string', () => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      'My javascript. My webpack.'
    );
    expect(result).toBeTruthy();
    expect(result?.[0]).toBe('javascript');
  });

  test.each([
    ['Bad Javascript. Is it bad?'],
    ['Bad Javascript, is it bad?'],
    ['Bad Javascript; is it bad?'],
    ['Bad (Javascript) is it bad?'],
    ['Bad "Javascript" is it bad?'],
    ["Bad 'Javascript' is it bad?"],
    ['Bad “Javascript” is it bad?'],
    ['Bad ‘Javascript’ is it bad?'],
    ['Bad "Javascript", is it bad?'],
    ['Bad Javascript: is this true?'],
    ['Bad Javascript!'],
    ['Bad Javascript?'],
  ])('should match a pattern regardless of punctuation: %s', (string) => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      string
    );
    expect(result).toBeTruthy();
  });

  test('should not match a pattern in as a part of a file name', () => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      'javascript.md'
    );
    expect(result).toBeFalsy();
  });

  test('should match a pattern regardless of its case', () => {
    const result = new RegExp(getMultipleWordRegExp(variants), 'igm').exec(
      'Javascript is good'
    );
    expect(result).toBeTruthy();
    expect(result?.[0]).toBe('Javascript');
  });

  test('should match several variants', () => {
    const regexp = new RegExp(getMultipleWordRegExp(variants), 'igm');
    const text = 'My JavaScript is better than your webpack';
    const result1 = regexp.exec(text);
    expect(result1).toBeTruthy();
    expect(result1?.[0]).toBe('JavaScript');
    const result2 = regexp.exec(text);
    expect(result2).toBeTruthy();
    expect(result2?.[0]).toBe('webpack');
  });
});

describe('getExactMatchRegExp', () => {
  test('returned RegExp should match exact term', () => {
    const regexp = new RegExp(getExactMatchRegExp('webpack'), 'igm');
    expect(regexp.test('Webpack')).toBeTruthy();
  });

  test.each([
    ['Javascript.'],
    ['Javascript,'],
    ['Javascript;'],
    ['(Javascript)'],
    ['"Javascript"'],
    ["'Javascript'"],
    ['"Javascript",'],
  ])('should match a pattern regardless of punctuation: %s', (string) => {
    const regexp = new RegExp(getExactMatchRegExp('javascript'), 'igm');
    expect(regexp.test(string)).toBeTruthy();
  });

  test('returned RegExp should not match in the middle of the word', () => {
    const regexp = new RegExp(getExactMatchRegExp('webpack'), 'igm');
    expect(regexp.test(`FooWebpack`)).toBeFalsy();
    expect(regexp.test(`WebpackFoo`)).toBeFalsy();
    expect(regexp.test(`FooWebpackFoo`)).toBeFalsy();
  });
});

describe('getAdvancedRegExp', () => {
  test('should return an exact match regexp', () => {
    const regexp = new RegExp(getAdvancedRegExp('bug[- ]fix(es)?'), 'igm');
    expect(regexp.test('bug-fix')).toBeTruthy();
  });

  test('should return regexp as is if it has look behinds', () => {
    const regexp = new RegExp(
      getAdvancedRegExp(String.raw`(?<=(?:\w+[^.?!])? )base64\b`),
      'igm'
    );
    expect(regexp.test('use Base64')).toBeTruthy();
  });

  test('should return regexp as is if it has positive look ahead', () => {
    const regexp = new RegExp(
      getAdvancedRegExp(String.raw`base64(?= \w)`),
      'igm'
    );
    expect(regexp.test('Base64 foo')).toBeTruthy();
  });

  test('should return regexp as is if it has negative look ahead', () => {
    const regexp = new RegExp(
      getAdvancedRegExp(String.raw`base64(?! \w)`),
      'igm'
    );
    expect(regexp.test('Base64')).toBeTruthy();
    expect(regexp.test('Base64 foo')).toBeFalsy();
  });

  test('should not match words inside filenames', () => {
    const regexp = new RegExp(
      getAdvancedRegExp(String.raw`(?<![\.-])css\b`),
      'igm'
    );
    expect(regexp.test('typings.for.css.modules.loader')).toBeFalsy();
    expect(regexp.test('typings-for-css-modules-loader')).toBeFalsy();
    expect(regexp.test('typings_for_css_modules_loader')).toBeFalsy();
    expect(regexp.test('typings for css modules loader')).toBeTruthy();
  });
});

describe('getReplacement', () => {
  test('should return a replacement from an array of words', () => {
    const result = getReplacement(
      'JavaScript',
      ['npm', 'JavaScript', 'webpack'],
      'Javascript'
    );
    expect(result).toEqual('JavaScript');
  });

  test('should return a replacement for a pattern', () => {
    const result = getReplacement('bug[- ]fix(es?)', 'bugfix$1', 'bug-fixes');
    expect(result).toEqual('bugfixes');
  });
});

tester.run('textlint-rule-terminology', rule, {
  valid: [
    { text: 'My JavaScript is good' },
    // Should skip code examples
    { text: 'My `javascript` is good' },
    // Should skip URLs
    { text: 'My [code](http://example.com/javascript) is good' },
    // Should keep a capital letter at the beginning of a sentense
    { text: 'Webpack is good' },
    // Should not warn when incorrect term is used as a part of another word
    { text: 'Your javascriptish code' },
    { text: 'javascriptish' },
    { text: 'Your uberjavascript code' },
    { text: 'uberjavascript' },
    // Should not warn when incorrect term is used as a part of a hyphenates word
    { text: 'Install javascript-some-plugin here' },
    { text: 'javascript-some-plugin' },
    { text: 'Install some-plugin-javascript here' },
    { text: 'some-plugin-javascript' },
    { text: 'I think Internet Explorer 6 is the best browser!' },
    // Should ignore `http` in the middle of a word
    { text: 'We should all use XMLHttpRequest everywhere' },
    // Filenames with .yaml extensions are valid
    { text: 'foo.yaml' },
    // Filenames with `yaml` inside are valid
    { text: 'foo-yaml.txt' },
    { text: 'foo_yaml.txt' },
    { text: 'foo-yaml-bar.txt' },
    { text: 'foo_yaml_bar.txt' },
    { text: 'fooyaml.txt' },
    { text: 'fooyaml.txt' },
  ],
  invalid: [
    {
      // https://github.com/sapegin/textlint-rule-terminology/discussions/71
      text: `A Github\n`,
      output: `A GitHub\n`,
      errors: [
        {
          message: 'Incorrect term: “Github”, use “GitHub” instead',
        },
      ],
    },
    {
      // One word
      text: 'My Javascript is good too',
      output: 'My JavaScript is good too',
      errors: [
        {
          message: 'Incorrect term: “Javascript”, use “JavaScript” instead',
        },
      ],
    },
    {
      // One word
      text: 'My Internet is good',
      output: 'My internet is good',
      errors: [
        {
          message: 'Incorrect term: “Internet”, use “internet” instead',
        },
      ],
    },
    {
      // Singular
      text: 'My bug-fix is good',
      output: 'My bugfix is good',
      errors: [
        {
          message: 'Incorrect term: “bug-fix”, use “bugfix” instead',
        },
      ],
    },
    {
      // Plural
      text: 'My bug-fixes are good',
      output: 'My bugfixes are good',
      errors: [
        {
          message: 'Incorrect term: “bug-fixes”, use “bugfixes” instead',
        },
      ],
    },
    {
      // Keep formatting
      text: 'My **Javascript** is good',
      output: 'My **JavaScript** is good',
      errors: [
        {
          message: 'Incorrect term: “Javascript”, use “JavaScript” instead',
        },
      ],
    },
    {
      // Several words, keep suffix
      text: 'Write change logs about source-maps',
      output: 'Write changelogs about source maps',
      errors: [
        {
          message: 'Incorrect term: “change logs”, use “changelogs” instead',
        },
        {
          message: 'Incorrect term: “source-maps”, use “source maps” instead',
        },
      ],
    },
    {
      // yaml -> YAML
      text: 'yaml files',
      output: 'YAML files',
      errors: [
        {
          message: 'Incorrect term: “yaml”, use “YAML” instead',
        },
      ],
    },
  ],
});

tester.run(
  'textlint-rule-terminology',
  {
    rules: [
      {
        ruleId: 'terminology',
        rule,
        options: {
          defaultTerms: true,
          terms: ['wordpress'],
        },
      },
    ],
  },
  {
    valid: [
      {
        text: 'This wordpress word is OK',
      },
    ],
    invalid: [
      {
        // Replace default
        text: 'My WordPress is good too',
        output: 'My wordpress is good too',
        errors: [
          {
            message: 'Incorrect term: “WordPress”, use “wordpress” instead',
          },
        ],
      },
    ],
  }
);
