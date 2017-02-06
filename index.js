const { RuleHelper } = require('textlint-rule-helper');
const { findKey, values, flatten, escapeRegExp } = require('lodash');

const DEFAULT_OPTIONS = {
	terms: './terms.json',
};

function reporter(context, options = {}) {
	const opts = Object.assign({}, DEFAULT_OPTIONS, options);
	const terms = typeof opts.terms === 'string' ? require(opts.terms) : opts.terms;

	const allMistakes = flatten(values(terms));
	const regExp = getRegExp(allMistakes);

	const helper = new RuleHelper(context);
	const { Syntax, RuleError, report, getSource } = context;
	return {
		[Syntax.Str](node) {
			if (helper.isChildNode(node, [Syntax.BlockQuote])) {
				return false;
			}

			return new Promise(resolve => {
				const text = getSource(node);
				const matches = text.match(regExp) || [];
				matches.forEach(match => {
					const index = text.indexOf(match);
					const suggestion = getSuggestion(terms, match);
					const message = `Incorrect usage of the term "${suggestion}": "${match}"`;
					report(node, new RuleError(message, { index }));
				});

				resolve();
			});
		},
	};
}

function getRegExp(variants) {
	return new RegExp(`\\b(\\w*(?:${variants.map(escapeRegExp).join('|')})\\w*)\\b`, 'ig');
}

function getSuggestion(terms, match) {
	return findKey(terms, mistakes => getRegExp(mistakes).test(match));
}

module.exports = {
	linter: reporter,
	fixer: reporter,
};
