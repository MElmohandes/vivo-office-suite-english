"use strict";
// Property names select program behavior even when their spelling is Chinese.
// Only translate their presentation at a rendering boundary.
function protectedLocalizationNodes(ast) {
  const protectedNodes = new Set();
  function visit(node, parent, key) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const child of node) visit(child, parent, key); return; }
    if (node.type === 'StringLiteral' && (
      ((parent?.type === 'MemberExpression' || parent?.type === 'OptionalMemberExpression') && parent.computed && key === 'property') ||
      ((parent?.type === 'ObjectProperty' || parent?.type === 'ObjectMethod') && key === 'key')
    )) protectedNodes.add(node.start + ':' + node.end);
    for (const [childKey, child] of Object.entries(node)) if (childKey !== 'loc') visit(child, node, childKey);
  }
  visit(ast);
  return protectedNodes;
}
module.exports = { protectedLocalizationNodes };
