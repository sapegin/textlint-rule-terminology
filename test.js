const TextLintTester = require('textlint-tester');
const rule = require('./index');

const { getRegExp, getExactMatchRegExps, getRuleForMatch } = rule.test;
const tester = new TextLintTester();

describe('getRegExp', () => {
	const variants = ['JavaScript', 'webpack'];
	it('should match a pattern as a full word', () => {
		const result = getRegExp(variants).exec('My JavaScript is good');
		expect(result).toBeTruthy();
		expect(result[1]).toBe('JavaScript');
	});

	it('should not match a pattern in the middle of a word', () => {
		const result = getRegExp(variants).exec('Foo superwebpacky bar');
		expect(result).toBeFalsy();
	});

	it('should not match a pattern at the beginning of a string', () => {
		const result = getRegExp(variants).exec('webpack bar');
		expect(result).toBeTruthy();
		expect(result[1]).toBe('webpack');
	});

	it('should not match a pattern at the end of a string', () => {
		const result = getRegExp(variants).exec('foo webpack');
		expect(result).toBeTruthy();
		expect(result[1]).toBe('webpack');
	});

	it('should not match a pattern at the beginning of a word with a hyphen', () => {
		const result = getRegExp(variants).exec('Foo webpack-ish bar');
		expect(result).toBeFalsy();
	});

	it('should not match a pattern in at the end of a word with a hyphen', () => {
		const result = getRegExp(variants).exec('Foo uber-webpack bar');
		expect(result).toBeFalsy();
	});

	it('should match a pattern at the end of a sentence', () => {
		const result = getRegExp(variants).exec('My javascript.');
		expect(result).toBeTruthy();
		expect(result[1]).toBe('javascript');
	});

	it('should match a pattern at the end of a sentence in the middle of a string', () => {
		const result = getRegExp(variants).exec('My javascript. My webpack.');
		expect(result).toBeTruthy();
		expect(result[1]).toBe('javascript');
	});

	it('should not match a pattern in as a part of a file name', () => {
		const result = getRegExp(variants).exec('javascript.md');
		expect(result).toBeFalsy();
	});

	it('should match a pattern regardless of its case', () => {
		const result = getRegExp(variants).exec('Javascript is good');
		expect(result).toBeTruthy();
		expect(result[1]).toBe('Javascript');
	});

	it('should match several variants', () => {
		const regexp = getRegExp(variants);
		const text = 'My JavaScript is better than your webpack';
		const result1 = regexp.exec(text);
		expect(result1).toBeTruthy();
		expect(result1[1]).toBe('JavaScript');
		const result2 = regexp.exec(text);
		expect(result2).toBeTruthy();
		expect(result2[1]).toBe('webpack');
	});
});

describe('getExactMatchRegExps', () => {
	it('should return RegExps as is', () => {
		const result = getExactMatchRegExps([/JavaScript/, /webpack/]);
		expect(result).toEqual([/JavaScript/, /webpack/]);
	});

	it('should convert strings to RegExps-as-strings', () => {
		const result = getExactMatchRegExps(['webpack']);
		expect(result).toEqual([[expect.stringContaining('\\bwebpack'), 'webpack']]);
	});

	it('returned RegExp should match exact term', () => {
		const result = getExactMatchRegExps(['webpack']);
		const regexp = new RegExp(result[0][0]);
		const term = result[0][1];
		expect(regexp.test(term)).toBeTruthy();
		expect(regexp.test(`foo${term}`)).toBeFalsy();
		expect(regexp.test(`${term}foo`)).toBeFalsy();
	});

	it('returned RegExp should not match term as a part of another word', () => {
		const result = getExactMatchRegExps(['webpack']);
		const regexp = new RegExp(result[0][0]);
		const term = result[0][1];
		expect(regexp.test(`foo${term}`)).toBeFalsy();
		expect(regexp.test(`${term}foo`)).toBeFalsy();
	});
});

describe('getRuleForMatch', () => {
	it('should return a rule that matches a term', () => {
		const result = getRuleForMatch([['webpack'], ['JavaScript']], 'javascript');
		expect(result).toBeTruthy();
		expect(result).toEqual(['JavaScript']);
	});
});

tester.run('textlint-rule-terminology', rule, {
	valid: [
		{
			text: 'My JavaScript is good',
		},
		{
			// Should skip code examples
			text: 'My `javascript` is good',
		},
		{
			// Should skip URLs
			text: 'My [code](http://example.com/javascript) is good',
		},
		{
			// Should keep a capital letter at the beginning of a sentense
			text: 'Webpack is good',
		},
		// Should not warn when incorrect term is used as a part of another word
		{
			text: 'Your javascriptish code',
		},
		{
			text: 'javascriptish',
		},
		{
			text: 'Your uberjavascript code',
		},
		{
			text: 'uberjavascript',
		},
		// Should not warn when incorrect term is used as a part of a hyphenates word
		{
			text: 'Install javascript-some-plugin here',
		},
		{
			text: 'javascript-some-plugin',
		},
		{
			text: 'Install some-plugin-javascript here',
		},
		{
			text: 'some-plugin-javascript',
		},
		{
			// Should not warn about file names
			text: 'Changelog.md',
		},
	],
	invalid: [
		{
			// One word
			text: 'My Javascript is good',
			output: 'My JavaScript is good',
			errors: [
				{
					message: 'Incorrect usage of the term: “Javascript”, use “JavaScript” instead',
				},
			],
		},
		{
			// Keep formatting
			text: 'My **Javascript** is good',
			output: 'My **JavaScript** is good',
			errors: [
				{
					message: 'Incorrect usage of the term: “Javascript”, use “JavaScript” instead',
				},
			],
		},
		{
			// Several words, keep suffix
			text: 'Write changelogs about source-maps',
			output: 'Write change logs about source maps',
			errors: [
				{
					message: 'Incorrect usage of the term: “changelogs”, use “change logs” instead',
				},
				{
					message: 'Incorrect usage of the term: “source-maps”, use “source maps” instead',
				},
			],
		},
	],
});
