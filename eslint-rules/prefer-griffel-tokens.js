'use strict';

const COLOR_KEY_PATTERN = /(?:^|[^a-z])(color|background|backgroundColor|borderColor|outlineColor|fill|stroke|boxShadow)(?:[^a-z]|$)/i;
const COLOR_VALUE_PATTERN = /#(?:[0-9a-fA-F]{3,8})|rgba?\(|hsla?\(/i;

function isIgnoredFile(fileName) {
  const normalized = fileName.replace(/\\/g, '/');
  return normalized.endsWith('/src/webparts/hbcProjectControls/theme/tokens.ts')
    || normalized.endsWith('/src/webparts/hbcProjectControls/theme/hbcTheme.ts');
}

function isLiteralColor(node) {
  if (!node) {
    return false;
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    return COLOR_VALUE_PATTERN.test(node.value);
  }

  if (node.type === 'TemplateLiteral') {
    return node.quasis.some((q) => COLOR_VALUE_PATTERN.test(q.value.raw));
  }

  return false;
}

function keyName(node) {
  if (!node) {
    return '';
  }

  if (node.type === 'Identifier') {
    return node.name;
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }

  return '';
}

function walkObjectForColorLiterals(context, obj) {
  for (const prop of obj.properties) {
    if (!prop || prop.type !== 'Property') {
      continue;
    }

    const propKey = keyName(prop.key);
    const propValue = prop.value;

    if (propValue && propValue.type === 'ObjectExpression') {
      walkObjectForColorLiterals(context, propValue);
      continue;
    }

    if (COLOR_KEY_PATTERN.test(propKey) && isLiteralColor(propValue)) {
      context.report({
        node: propValue,
        message: 'Prefer Fluent tokens in makeStyles and avoid literal color values.',
      });
    }
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer Griffel token-based styling over inline/literal style usage.',
    },
    schema: [],
  },

  create(context) {
    const fileName = context.getFilename();
    if (isIgnoredFile(fileName)) {
      return {};
    }

    return {
      JSXAttribute(node) {
        if (node.name && node.name.type === 'JSXIdentifier' && node.name.name === 'style') {
          context.report({
            node,
            message: 'Prefer Griffel makeStyles with tokens instead of inline style literals.',
          });
        }
      },

      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'makeStyles') {
          return;
        }

        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== 'ObjectExpression') {
          return;
        }

        walkObjectForColorLiterals(context, firstArg);
      },
    };
  },
};
