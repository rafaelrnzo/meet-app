export const preferDefaultAsNamed = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using `{ default as ... }` instead of default import',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferNamed: 'Prefer `{ default as {{name}} }` instead of default import.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        for (const spec of node.specifiers) {
          if (spec.type === 'ImportDefaultSpecifier') {
            const name = spec.local.name
            context.report({
              node: spec,
              messageId: 'preferNamed',
              data: { name },
              fix(fixer) {
                const source = context.getSourceCode()
                const importText = source.getText(node)
                const fixed = importText.replace(
                  new RegExp(`import\\s+${name}\\s+from`),
                  `import { default as ${name} } from`
                )
                return fixer.replaceText(node, fixed)
              },
            })
          }
        }
      },
    }
  },
}

export const preferNamedExportRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow inline export of functions, variables, classes, enums, or types. Require exporting via a separate export statement.',
      recommended: 'warn',
    },
    fixable: undefined,
    schema: [],
    messages: {
      noInlineExport:
        'Require exporting via separate export or export type `export { name }` statement.',
    },
  },
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (!node.declaration) return

        const decl = node.declaration
        let kind = ''
        switch (decl.type) {
          case 'FunctionDeclaration':
            kind = 'function'
            break
          case 'VariableDeclaration':
            kind = 'variable'
            break
          case 'ClassDeclaration':
            kind = 'class'
            break
          case 'TSEnumDeclaration':
            kind = 'enum'
            break
          case 'TSTypeAliasDeclaration':
            kind = 'type'
            break
          case 'TSInterfaceDeclaration':
            kind = 'interface'
            break
        }

        if (kind) {
          context.report({
            node,
            messageId: 'noInlineExport',
            data: { kind },
          })
        }
      },
    }
  },
}
