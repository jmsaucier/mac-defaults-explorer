function valueType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value === 'object' ? 'object' : typeof value;
}

function makePreview(type, value) {
  if (type === 'string') return value;
  if (type === 'number' || type === 'boolean') return String(value);
  if (type === 'null') return 'null';
  if (type === 'array') return `Array(${value.length})`;
  if (type === 'object') return `Object(${Object.keys(value).length})`;
  return String(value);
}

function toTreeNode(key, value, path = []) {
  const type = valueType(value);
  const nodePath = [...path, key];
  const id = nodePath.join('.');

  if (type === 'array') {
    return {
      id,
      key,
      path: nodePath,
      type,
      preview: makePreview(type, value),
      value: null,
      children: value.map((entry, index) => toTreeNode(`[${index}]`, entry, nodePath)),
    };
  }

  if (type === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return {
      id,
      key,
      path: nodePath,
      type,
      preview: makePreview(type, value),
      value: null,
      children: entries.map(([childKey, childValue]) => toTreeNode(childKey, childValue, nodePath)),
    };
  }

  return {
    id,
    key,
    path: nodePath,
    type,
    preview: makePreview(type, value),
    value,
    children: [],
  };
}

function domainObjectToTree(domainObject) {
  if (!domainObject || typeof domainObject !== 'object' || Array.isArray(domainObject)) {
    return [];
  }

  return Object.entries(domainObject)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => toTreeNode(key, value, []));
}

module.exports = {
  domainObjectToTree,
};
