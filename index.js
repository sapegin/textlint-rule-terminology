const { RuleHelper } = require('textlint-rule-helper');
const { find, upperFirst } = require('lodash');

const DEFAULT_OPTIONS = {
	terms: './terms.json',
	skip: ['BlockQuote'],
};
const sentenceStartRegExp = /\w+[.?!]\)? $/;

function reporter(context, options = {}) {
	const opts = Object.assign({}, DEFAULT_OPTIONS, options);
	const terms = typeof opts.terms === 'string' ? require(opts.terms) : opts.terms;
	const skip = options.skip;

	// Make RegExps for exact match words
	const rules = terms.map(term => (
		typeof term === 'string'
			? [`\\b${term}\\b`, term] // Exact match of a word
			: term
	));

	// Regexp for all possible mistakes
	const allMistakes = rules.map(rule => rule[0]);
	const regExp = getRegExp(allMistakes);

	const helper = new RuleHelper(context);
	const { Syntax, RuleError, report, fixer, getSource } = context;
	return {
		[Syntax.Str](node) {
			if (helper.isChildNode(node, skip.map((rule) => Syntax[rule]))) {
				return false;
			}

			return new Promise(resolve => {
				const text = getSource(node);

				let match;
				while (match = regExp.exec(text)) { // eslint-disable-line no-cond-assign
					const index = match.index;
					const matched = match[0];
					const rule = getRuleForMatch(rules, matched);

					let replacement = matched.replace(new RegExp(rule[0], 'i'), rule[1]);

					// Capitalize word in the beginning of a sentense if the original word was capitalized
					const textBeforeMatch = text.substring(0, index);
					const isSentenceStart = index === 0 || sentenceStartRegExp.test(textBeforeMatch);
					if (isSentenceStart && upperFirst(matched) === matched) {
						replacement = upperFirst(replacement);
					}

					// Skip correct spelling
					if (matched === replacement) {
						continue;
					}

					const range = [index, index + matched.length];
					const fix = fixer.replaceTextRange(range, replacement);
					const message = `Incorrect usage of the term: “${matched}”, use “${replacement}” instead`;
					report(node, new RuleError(message, { index, fix }));
				}

				resolve();
			});
		},
	};
}

function getRegExp(variants) {
	return new RegExp(`(\\b(?:${variants.join('|')})\\b)`, 'ig');
}

function getRuleForMatch(rules, match) {
	return find(rules, rule => new RegExp(rule[0], 'i').test(match));
}

module.exports = {
	linter: reporter,
	fixer: reporter,
};
