/**
 * Custom CodeMirror mode and syntax highlighter for PhyxCalc expressions.
 * Highlights numbers, complex units, physical constants, operators, keywords, and comments.
 */

import { StreamLanguage, StringStream } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const KEYWORDS = new Set([
  'if',
  'then',
  'else',
  'and',
  'or',
  'xor',
  'nand',
  'nor',
  'xand',
  'mod',
  'data',
  'datalog',
  'hex',
  'oct',
  'bin',
  'ans',
]);

const BUILTIN_FUNCTIONS = new Set([
  'sin',
  'cos',
  'tan',
  'cot',
  'sec',
  'csc',
  'asin',
  'acos',
  'atan',
  'acot',
  'asec',
  'acsc',
  'arcsin',
  'arccos',
  'arctan',
  'arccot',
  'arcsec',
  'arccsc',
  'sinh',
  'cosh',
  'tanh',
  'coth',
  'sech',
  'csch',
  'asinh',
  'acosh',
  'atanh',
  'acoth',
  'asech',
  'acsch',
  'exp',
  'ln',
  'log',
  'log10',
  'log2',
  'root',
  'root3',
  'sqrt',
  'sqr',
  'abs',
  're',
  'im',
  'norm',
  'conj',
  'min',
  'max',
  'avg',
  'int',
  'trunc',
  'floor',
  'round',
  'ceil',
  'sign',
  'heaviside',
  'rand',
  'rnd',
  'randi',
  'rndi',
  'randg',
  'rndg',
  'gcd',
  'lcm',
  'bcd',
  'tobcd',
]);

export const phyxcalcLanguage = StreamLanguage.define({
  name: 'phyxcalc',
  startState() {
    return { inBlockComment: false };
  },
  tokenTable: {
    comment: t.comment,
    number: t.number,
    operator: t.operator,
    keyword: t.keyword,
    function: t.function(t.variableName),
    constant: t.constant(t.variableName),
    variable: t.variableName,
    special: t.special(t.variableName),
  },
  token(stream: StringStream, state: { inBlockComment: boolean }): string | null {
    if (state.inBlockComment) {
      if (stream.match(/\*\//)) {
        state.inBlockComment = false;
        return 'comment';
      }
      stream.next();
      return 'comment';
    }

    if (stream.match(/\/\//)) {
      stream.skipToEnd();
      return 'comment';
    }

    if (stream.match(/\/\*/)) {
      state.inBlockComment = true;
      return 'comment';
    }

    // Whitespace
    if (stream.eatSpace()) return null;

    // Number literals: hex, oct, bin, float/scientific
    if (stream.match(/^0x[0-9a-fA-F]+/)) return 'number';
    if (stream.match(/^0o[0-7]+/)) return 'number';
    if (stream.match(/^0b[01]+/)) return 'number';
    if (stream.match(/^[0-9]+(?:\.[0-9]*)?(?:[eE][+-]?[0-9]+)?/)) {
      return 'number';
    }

    // Imaginary unit j or i
    if (stream.match(/^[ji]\b/)) return 'special';

    // Superscripts
    if (stream.match(/^[²³]/)) return 'operator';

    // Greek letters and math symbols
    if (stream.match(/^[α-ωΑ-ΩπµΩ°]/)) return 'special';

    // Conversion arrow
    if (stream.match(/^->/)) return 'keyword';

    // Operators
    if (stream.match(/^[+\-*/^!=<>%&|~?:,;]/)) return 'operator';

    // Identifiers: keywords, functions, variables, constants
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
      const word = stream.current().toLowerCase();
      if (KEYWORDS.has(word)) return 'keyword';
      if (BUILTIN_FUNCTIONS.has(word)) return 'function';
      if (stream.current().endsWith('_') || word === 'pi' || word === 'e') {
        return 'constant';
      }
      return 'variable';
    }

    stream.next();
    return null;
  },
});
