import fs from 'node:fs';
import { createRequire } from 'node:module';
import stripJsonComments from 'strip-json-comments';
import { RuleHelper } from 'textlint-rule-helper';
import upperFirst from 'lodash/upperFirst.js';
import type { TxtNode, TxtNodeType } from '@textlint/ast-node-types';
import type {
  TextlintFixableRuleModule,
  TextlintRuleContext,
} from '@textlint/types';

/**
 * A term pattern could be:
 * - string for exact match
 * - tuple with a RegEx and replacement(s)
 */
type Tuple = [string, string | string[]];
type Term = string | Tuple;

export interface Options {
  /** List of additional words: filename, npm module or an array of words */
  terms: string | Term[];
  skip: TxtNodeType[];
  defaultTerms: boolean;
  exclude: string[];
}

const DEFAULT_OPTIONS: Options = {
  terms: [],
  skip: ['BlockQuote'],
  defaultTerms: true,
  exclude: [],
};

const sentenceStartRegExp = /\w+[!.?]\)? $/;
const punctuation = String.raw`[\.,;:!?'"’”)]`;

function reporter(
  context: TextlintRuleContext,
  userOptions: Partial<Options> = {}
) {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  const terms = getTerms(options.defaultTerms, options.terms, options.exclude);

  // Match all words (plain strings) with a single regexp
  const words = terms.filter((rule) => typeof rule === 'string');
  const exactWordRules: Tuple[] = [[getMultipleWordRegExp(words), words]];

  // Create a separate regexp of each array rule ([pattern, replacement])
  const advancedRules: Tuple[] = terms.filter(
    (rule) => typeof rule !== 'string'
  );

  const rules = [...exactWordRules, ...advancedRules];

  const helper = new RuleHelper(context);
  const { Syntax, RuleError, report, fixer, getSource } = context;
  return {
    [Syntax.Str](node: TxtNode) {
      return new Promise<void>((resolve) => {
        if (
          helper.isChildNode(
            // @ts-expect-error: Who the fuck knows what you want here ;-/
            node,
            options.skip.map((rule) => Syntax[rule])
          )
        ) {
          return resolve();
        }

        const text = getSource(node);

        for (const [pattern, replacements] of rules) {
          const regExp = new RegExp(
            typeof pattern === 'string' ? getAdvancedRegExp(pattern) : pattern,
            'igm'
          );

          let match;

          while ((match = regExp.exec(text))) {
            const index = match.index;
            const matched = match[0];

            let replacement = getReplacement(pattern, replacements, matched);
            if (replacement === undefined) {
              throw new Error('No replacement found');
            }

            // Capitalize word in the beginning of a sentence if the original word was capitalized
            const textBeforeMatch = text.slice(0, Math.max(0, index));
            const isSentenceStart =
              index === 0 || sentenceStartRegExp.test(textBeforeMatch);
            if (isSentenceStart && upperFirst(matched) === matched) {
              replacement = upperFirst(replacement);
            }

            // Skip correct spelling
            if (matched === replacement) {
              continue;
            }

            const fix = fixer.replaceTextRange(
              [index, index + matched.length],
              replacement
            );
            const message = `Incorrect term: “${matched.trim()}”, use “${replacement.trim()}” instead`;
            report(node, new RuleError(message, { index, fix }));
          }
        }

        resolve();
      });
    },
  };
}

export function getTerms(
  defaultTerms: boolean,
  terms: string | Term[],
  exclude: string[]
) {
  const defaults = defaultTerms ? loadJson('../terms.jsonc') : [];
  const extras = typeof terms === 'string' ? loadJson(terms) : terms;
  // Order matters, the first term to match is used. We prioritize user
  // 'extras' before defaults
  const listTerms = [...(Array.isArray(extras) ? extras : []), ...defaults];

  // Filter on all terms
  if (Array.isArray(exclude)) {
    return listTerms.filter((term) => {
      if (Array.isArray(term)) {
        return !exclude.includes(term[0]);
      }
      return !exclude.includes(term);
    });
  }
  return listTerms;
}

function loadJson(modulePath: string) {
  const require = createRequire(import.meta.url);
  const resolvedModule = require.resolve(modulePath);
  const json = fs.readFileSync(resolvedModule, 'utf8');
  return JSON.parse(stripJsonComments(json)) as Term[];
}

/**
 * Match exact word in the middle of the text
 */
export function getExactMatchRegExp(pattern: string) {
  // 1. Beginning of the string, or any character that isn't "-"
  //    or alphanumeric
  // 2. Not a dot "." (to make it ignore file extensions)
  // 3. Word boundary
  // 4. Exact match of the pattern
  // 5. Word boundary
  // 6. Space, punctuation + space, punctuation + punctuation,
  //    or punctuation at the end of the string, end of the string
  return `(?<=^|[^-\\w])(?<!\\.)\\b${pattern}\\b(?= |${punctuation} |${punctuation}${punctuation}|${punctuation}$|$)`;
}

/**
 * Match any of given words exactly in the middle of the text
 */
export function getMultipleWordRegExp(words: string[]) {
  return getExactMatchRegExp(`(?:${words.join('|')})`);
}

/**
 * Match pattern on word boundaries in the middle of the text unless the pattern
 * has look behinds or look aheads
 */
export function getAdvancedRegExp(pattern: string) {
  if (
    // Look behind: (?<=...) and (?<!...)
    pattern.startsWith('(?<') ||
    // Positive look ahead: (?=...)
    pattern.includes('(?=') ||
    // Negative look ahead: (?!...)
    pattern.includes('(?!')
  ) {
    return pattern;
  }
  return getExactMatchRegExp(pattern);
}

export function getReplacement(
  pattern: string,
  replacements: string | string[],
  matched: string
) {
  if (Array.isArray(replacements)) {
    return findWord(replacements, matched);
  }

  const tag = 'xyz';
  return `${tag} ${matched} ${tag}`
    .replace(new RegExp(pattern, 'i'), replacements)
    .slice(tag.length + 1, -(tag.length + 1));
}

export function findWord(items: string[], match: string) {
  const lowerCaseMatch = match.toLowerCase();
  return items.find((word) => word.toLowerCase() === lowerCaseMatch);
}

const rule: TextlintFixableRuleModule<Partial<Options>> = {
  linter: reporter,
  fixer: reporter,
};

export default rule;
