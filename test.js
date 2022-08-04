const TextLintTester = require('textlint-tester');
const rule = require('./index');

const {
	getTerms,
	findWord,
	getMultipleWordRegExp,
	getExactMatchRegExp,
	getAdvancedRegExp,
	getReplacement,
} = rule.test;
const tester = new TextLintTester();

describe('getTerms', () => {
	it('should load default terms', () => {
		const result = getTerms(true);
		expect(result).toBeTruthy();
		expect(result[0]).toBe('Airbnb');
	});

	it('should load user terms', () => {
		const result = getTerms(false, ['coffee']);
		expect(result).toBeTruthy();
		expect(result).not.toContain('Airbnb');
		expect(result).toContain('coffee');
	});

	it('should append user terms to defaults', () => {
		const result = getTerms(true, ['coffee']);
		expect(result).toBeTruthy();
		expect(result).toContain('Airbnb');
		expect(result).toContain('coffee');
	});

	it('should load user terms from a file', () => {
		const result = getTerms(false, 'test/terms.json');
		expect(result).toBeTruthy();
		expect(result).not.toContain('Airbnb');
		expect(result[0]).toContain('pizza');
	});

	it('should remove the excluded terms', () => {
		const result = getTerms(true, ['coffee', 'mocha'], ['CSS', 'coffee']);
		expect(result).toBeTruthy();
		expect(result).not.toContain('CSS');
		expect(result).not.toContain('coffee');
		expect(result).toContain('mocha');
		expect(
			result.some(term => Array.isArray(term) && term[1] === 'Node.js')
		).toBe(true);
	});

	it('should remove the excluded terms (defined as Array)', () => {
		const result = getTerms(true, [], ['Node[ .]js']);
		expect(result).toBeTruthy();
		expect(
			result.some(term => Array.isArray(term) && term[1] === 'Node.js')
		).toBe(false);
	});
});

describe('findWord', () => {
	it('should find a word in an array ignoring the case', () => {
		const result = findWord(['pasta', 'piZZa', 'coffee'], 'Pizza');
		expect(result).toBe('piZZa');
	});
});

describe('getMultipleWordRegExp', () => {
	const variants = ['JavaScript', 'webpack'];

	it('should match a pattern as a full word', () => {
		const result = getMultipleWordRegExp(variants).exec(
			'My JavaScript is good'
		);
		expect(result[0]).toBe('JavaScript');
	});

	it('should not match a pattern in the middle of a word', () => {
		const result = getMultipleWordRegExp(variants).exec(
			'Foo superwebpacky bar'
		);
		expect(result).toBeFalsy();
	});

	it('should not match a pattern at the beginning of a string', () => {
		const result = getMultipleWordRegExp(variants).exec('webpack bar');
		expect(result).toBeTruthy();
		expect(result[0]).toBe('webpack');
	});

	it('should not match a pattern at the end of a string', () => {
		const result = getMultipleWordRegExp(variants).exec('foo webpack');
		expect(result).toBeTruthy();
		expect(result[0]).toBe('webpack');
	});

	it('should not match a pattern at the beginning of a word with a hyphen', () => {
		const result = getMultipleWordRegExp(variants).exec('Foo webpack-ish bar');
		expect(result).toBeFalsy();
	});

	it('should not match a pattern in at the end of a word with a hyphen', () => {
		const result = getMultipleWordRegExp(variants).exec('Foo uber-webpack bar');
		expect(result).toBeFalsy();
	});

	it('should match a pattern at the end of a sentence', () => {
		const result = getMultipleWordRegExp(variants).exec('My javascript.');
		expect(result).toBeTruthy();
		expect(result[0]).toBe('javascript');
	});

	it('should match a pattern at the end of a sentence in the middle of a string', () => {
		const result = getMultipleWordRegExp(variants).exec(
			'My javascript. My webpack.'
		);
		expect(result).toBeTruthy();
		expect(result[0]).toBe('javascript');
	});

	it.each([
		['Bad Javascript. Is it bad?'],
		['Bad Javascript, is it bad?'],
		['Bad Javascript; is it bad?'],
		['Bad (Javascript) is it bad?'],
		['Bad "Javascript" is it bad?'],
		["Bad 'Javascript' is it bad?"],
		['Bad "Javascript", is it bad?'],
	])('should match a pattern regardless of punctuation: %s', string => {
		const result = getMultipleWordRegExp(variants).exec(string);
		expect(result).toBeTruthy();
	});

	it('should not match a pattern in as a part of a file name', () => {
		const result = getMultipleWordRegExp(variants).exec('javascript.md');
		expect(result).toBeFalsy();
	});

	it('should match a pattern regardless of its case', () => {
		const result = getMultipleWordRegExp(variants).exec('Javascript is good');
		expect(result).toBeTruthy();
		expect(result[0]).toBe('Javascript');
	});

	it('should match several variants', () => {
		const regexp = getMultipleWordRegExp(variants);
		const text = 'My JavaScript is better than your webpack';
		const result1 = regexp.exec(text);
		expect(result1).toBeTruthy();
		expect(result1[0]).toBe('JavaScript');
		const result2 = regexp.exec(text);
		expect(result2).toBeTruthy();
		expect(result2[0]).toBe('webpack');
	});
});

describe('getExactMatchRegExp', () => {
	it('returned RegExp should match exact term', () => {
		const regexp = getExactMatchRegExp('webpack');
		expect(regexp.test('Webpack')).toBeTruthy();
	});

	it.each([
		['Javascript.'],
		['Javascript,'],
		['Javascript;'],
		['(Javascript)'],
		['"Javascript"'],
		["'Javascript'"],
		['"Javascript",'],
	])('should match a pattern regardless of punctuation: %s', string => {
		const regexp = getExactMatchRegExp('javascript');
		expect(regexp.test(string)).toBeTruthy();
	});

	it('returned RegExp should not match in the middle of the word', () => {
		const regexp = getExactMatchRegExp('webpack');
		expect(regexp.test(`FooWebpack`)).toBeFalsy();
		expect(regexp.test(`WebpackFoo`)).toBeFalsy();
		expect(regexp.test(`FooWebpackFoo`)).toBeFalsy();
	});
});

describe('getAdvancedRegExp', () => {
	it('should return an exact match regexp', () => {
		const regexp = getAdvancedRegExp('bug[- ]fix(es)?');
		expect(regexp.test('bug-fix')).toBeTruthy();
	});

	it('should return regexp as is if it has look behinds', () => {
		const regexp = getAdvancedRegExp('(?<=(?:\\w+[^.?!])? )base64\\b');
		expect(regexp.test('use Base64')).toBeTruthy();
	});

	it('should return regexp as is if it has positive look ahead', () => {
		const regexp = getAdvancedRegExp('base64(?= \\w)');
		expect(regexp.test('Base64 foo')).toBeTruthy();
	});

	it('should return regexp as is if it has negative look ahead', () => {
		const regexp = getAdvancedRegExp('base64(?! \\w)');
		expect(regexp.test('Base64')).toBeTruthy();
		expect(regexp.test('Base64 foo')).toBeFalsy();
	});
});

describe('getReplacement', () => {
	it('should return a replacement from an array of words', () => {
		const result = getReplacement(
			'JavaScript',
			['npm', 'JavaScript', 'webpack'],
			'Javascript'
		);
		expect(result).toEqual('JavaScript');
	});

	it('should return a replacement for a pattern', () => {
		const result = getReplacement('bug[- ]fix(es?)', 'bugfix$1', 'bug-fixes');
		expect(result).toEqual('bugfixes');
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
			text: 'Filetype.md',
		},
		{
			text: 'I think Internet Explorer 6 is the best browser!',
		},
	],
	invalid: [
		{
			// One word
			text: 'My Javascript is good too',
			output: 'My JavaScript is good too',
			errors: [
				{
					message:
						'Incorrect usage of the term: “Javascript”, use “JavaScript” instead',
				},
			],
		},
		{
			// One word
			text: 'My Internet is good',
			output: 'My internet is good',
			errors: [
				{
					message:
						'Incorrect usage of the term: “Internet”, use “internet” instead',
				},
			],
		},
		{
			// Singular
			text: 'My bug-fix is good',
			output: 'My bugfix is good',
			errors: [
				{
					message:
						'Incorrect usage of the term: “bug-fix”, use “bugfix” instead',
				},
			],
		},
		{
			// Plural
			text: 'My bug-fixes are good',
			output: 'My bugfixes are good',
			errors: [
				{
					message:
						'Incorrect usage of the term: “bug-fixes”, use “bugfixes” instead',
				},
			],
		},
		{
			// Keep formatting
			text: 'My **Javascript** is good',
			output: 'My **JavaScript** is good',
			errors: [
				{
					message:
						'Incorrect usage of the term: “Javascript”, use “JavaScript” instead',
				},
			],
		},
		{
			// Several words, keep suffix
			text: 'Write change logs about source-maps',
			output: 'Write changelogs about source maps',
			errors: [
				{
					message:
						'Incorrect usage of the term: “change logs”, use “changelogs” instead',
				},
				{
					message:
						'Incorrect usage of the term: “source-maps”, use “source maps” instead',
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
						message:
							'Incorrect usage of the term: “WordPress”, use “wordpress” instead',
					},
				],
			},
		],
	}
);
