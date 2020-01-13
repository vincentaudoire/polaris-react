import {readFileSync} from 'fs';
import glob from 'glob';
import {parse, Node} from 'scss-parser';
import {roleVariants, toCssCustomPropertySyntax, Tokens} from './theme';

const COMMA = ',';
const SPACE = 'space';
const KIND = {
  Arguments: 'arguments',
  Function: 'function',
  Var: 'var',
  Declaration: 'declaration',
  Property: 'property',
  Operator: 'operator',
};

// The parser has trouble with argument lists
// e.g. @mixin example($list...)
const IGNORE_FILES = [
  'src/styles/foundation/_utilities.scss',
  'src/styles/shared/_interaction-state.scss',
];

export function getAllCustomProperties(): Promise<[string[], string[]]> {
  return new Promise((resolve, reject) => {
    const customProperties: string[] = [];
    const customPropertyDeclaration: string[] = [];
    glob('src/**/*.scss', {ignore: IGNORE_FILES}, function(err, files) {
      if (err) reject(err);

      for (const file of files) {
        findAllCustomProperties(
          parse(readFileSync(file, {encoding: 'utf8'})),
          customProperties,
          customPropertyDeclaration,
        );
      }

      resolve([
        uniqueArray(customProperties),
        uniqueArray(customPropertyDeclaration),
      ]);
    });
  });
}

function findAllCustomProperties(
  sourceFile: Node,
  customProperties: string[],
  customPropertyDeclaration: string[],
) {
  if (!sourceFile.value || !Array.isArray(sourceFile.value)) return [];
  searchAndAddCustomProperties(sourceFile.value);

  function searchAndAddCustomProperties(node: Node | Node[]) {
    if (Array.isArray(node)) {
      node.forEach(searchAndAddCustomProperties);
      return;
    }

    switch (node.type) {
      case KIND.Function:
        if (isVarFunction(node)) {
          visitAll(node, (functionValueNode) => {
            if (functionValueNode.type === KIND.Arguments) {
              customProperties.push(buildCustomPropertyName(functionValueNode));
            }
          });
        }
        break;
      case KIND.Declaration:
        if (
          isCustomPropertyDeclaration(node) &&
          typeof node.value[0] !== 'string'
        ) {
          customPropertyDeclaration.push(
            buildCustomPropertyName(node.value[0]),
          );
        }
    }

    visitAll(node, searchAndAddCustomProperties);
  }
}

function uniqueArray<T>(arr: T[]) {
  return [...new Set(arr)];
}

function isCustomPropertyDeclaration(node: Node) {
  return (
    Array.isArray(node.value) &&
    node.value[0].type === KIND.Property &&
    typeof node.value[0].value[0] === 'object' &&
    node.value[0].value[0].type === KIND.Operator
  );
}

function isVarFunction(node: Node) {
  return Array.isArray(node.value) && node.value[0].value === KIND.Var;
}

function visitAll(node: Node, cb: (node: Node) => void) {
  if (!node.value || !Array.isArray(node.value)) return;
  node.value.forEach(cb);
}

function buildCustomPropertyName(node: Node) {
  let name = '';
  for (const charNode of node.value) {
    if (
      typeof charNode !== 'object' ||
      charNode.value === COMMA ||
      charNode.value === SPACE
    )
      break;
    name += charNode.value;
  }

  return name.trim();
}

export const nonDesignLangaugeCustomProperties = [
  '--global-ribbon-height',
  '--toast-translate-y-out',
  '--toast-translate-y-in',
  '--top-bar-background',
  '--unselected-range',
  '--Polaris-RangeSlider-progress-lower',
  '--selected-range',
  '--Polaris-RangeSlider-progress-upper',
  '--gradient-colors',
  '--Polaris-RangeSlider-progress',
  '--Polaris-RangeSlider-output-factor',
  '--top-bar-color',
  '--top-bar-background-lighter',
];

export const designLangaugeCustomProperties = ([] as string[]).concat(
  ...Object.values(roleVariants).map((variant) =>
    variant.map(({name}) => toCssCustomPropertySyntax(name)),
  ),
  ...Object.keys(Tokens).map(toCssCustomPropertySyntax),
);
