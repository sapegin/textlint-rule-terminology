const fs = require('fs');
const path = require('path');
const stripJsonComments = require('strip-json-comments');
const { RuleHelper } = require('textlint-rule-helper');
const { find, upperFirst } = require('lodash');

const DEFAULT_OPTIONS = {
	terms: [],
	skip: ['BlockQuote'],
	defaultTerms: true,
	exclude: [],
};
const sentenceStartRegExp = /\w+[.?!]\)? $/;

function reporter(context, options = {}) {
	const opts = Object.assign({}, DEFAULT_OPTIONS, options);
	const terms = getTerms(opts.defaultTerms, opts.terms, opts.exclude);
	const rules = getExactMatchRegExps(terms);

	// Regexp for all possible mistakes
	const allMistakes = rules.map(rule => rule[0]);
	const regExp = getRegExp(allMistakes);

	const helper = new RuleHelper(context);
	const { Syntax, RuleError, report, fixer, getSource } = context;
	return {
		[Syntax.Str](node) {
			if (helper.isChildNode(node, opts.skip.map(rule => Syntax[rule]))) {
				return false;
			}

			return new Promise(resolve => {
				const text = getSource(node);

				let match;
				// eslint-disable-next-line no-cond-assign
				while ((match = regExp.exec(text))) {
					const index = match.index;
					const matched = match[0];
					const rule = getRuleForMatch(rules, matched);

					let replacement = matched.replace(new RegExp(rule[0], 'i'), rule[1]);

					// Capitalize word in the beginning of a sentense if the original word was capitalized
					const textBeforeMatch = text.substring(0, index);
					const isSentenceStart =
						index === 0 || sentenceStartRegExp.test(textBeforeMatch);
					if (isSentenceStart && upperFirst(matched) === matched) {
						replacement = upperFirst(replacement);
					}

					// Skip correct spelling
					if (matched === replacement) {
						continue;
					}

					const range = [index, index + matched.length];
					const fix = fixer.replaceTextRange(range, replacement);
					const message = `Incorrect usage of the term: “${matched.trim()}”, use “${replacement.trim()}” instead`;
					report(node, new RuleError(message, { index, fix }));
				}

				resolve();
			});
		},
	};
}

function getTerms(defaultTerms, terms, exclude) {
	const defaults = defaultTerms
		? loadJson(path.resolve(__dirname, 'terms.json'))
		: [];
	const extras = typeof terms === 'string' ? loadJson(terms) : terms;
	const listTerms = defaults.concat(extras);

	if (Array.isArray(exclude)) {
		return listTerms.filter(term => exclude.indexOf(term) === -1);
	}

	return listTerms;
}
function loadJson(filepath) {
	const json = readTermsFile(path.resolve(filepath));
	return JSON.parse(stripJsonComments(json));
}

function readTermsFile(filepath) {
	try {
		return fs.readFileSync(filepath, 'utf8');
	} catch (err) {
		if (err.code === 'ENOENT') {
			throw new Error(`Terms file not found: ${filepath}`);
		} else {
			throw err;
		}
	}
}

function getRegExp(variants) {
	return new RegExp(
		`(?:^|[^-\\w])((?:${variants.join('|')})(?= |\\. |\\.$|$))`,
		'ig'
	);
}

// Make RegExps for exact match words
function getExactMatchRegExps(terms) {
	return terms.map(term =>
		typeof term === 'string'
			? [`\\b${term}\\b`, term] // Exact match of a word
			: term
	);
}

function getRuleForMatch(rules, match) {
	return find(rules, rule => new RegExp(rule[0], 'i').test(match));
}

module.exports = {
	linter: reporter,
	fixer: reporter,
	test: {
		getTerms,
		getRegExp,
		getExactMatchRegExps,
		getRuleForMatch,
	},
};
