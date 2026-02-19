'use strict';

function isAdapterFile(fileName) {
  const normalized = fileName.replace(/\\/g, '/');
  return normalized.includes('/src/webparts/hbcProjectControls/tanstack/table/');
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct @tanstack/react-table imports outside adapter layer.',
    },
    schema: [],
  },

  create(context) {
    const fileName = context.getFilename();

    return {
      ImportDeclaration(node) {
        if (!node.source || node.source.value !== '@tanstack/react-table') {
          return;
        }

        if (isAdapterFile(fileName)) {
          return;
        }

        context.report({
          node,
          message: 'Import @tanstack/react-table only inside src/webparts/hbcProjectControls/tanstack/table/**.',
        });
      },
    };
  },
};
