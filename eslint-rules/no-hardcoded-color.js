const COLOR_LITERAL_PATTERN = /^(#(?:[0-9a-fA-F]{3,8})|rgba?\([^)]*\)|hsla?\([^)]*\))$/;

function isIgnoredFile(fileName) {
  const normalized = fileName.replace(/\\/g, '/');
  return normalized.endsWith('/src/webparts/hbcProjectControls/theme/tokens.ts')
    || normalized.endsWith('/src/webparts/hbcProjectControls/theme/hbcTheme.ts');
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hardcoded color literals in app source.'
    },
    schema: []
  },

  create(context) {
    const fileName = context.getFilename();
    if (isIgnoredFile(fileName)) {
      return {};
    }

    function reportIfColorLiteral(node, value) {
      if (typeof value !== 'string') {
        return;
      }
      if (!COLOR_LITERAL_PATTERN.test(value.trim())) {
        return;
      }
      context.report({
        node,
        message: 'Use Fluent tokens or HBC_COLORS constants instead of hardcoded color literals.'
      });
    }

    return {
      Literal(node) {
        reportIfColorLiteral(node, node.value);
      },
      TemplateElement(node) {
        reportIfColorLiteral(node, node.value.raw);
      }
    };
  }
};
