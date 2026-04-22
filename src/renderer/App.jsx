const React = require('react');

function treeFilter(nodes, query) {
  if (!query) return nodes;
  const lowered = query.toLowerCase();

  return nodes
    .map((node) => {
      const selfMatch =
        node.key.toLowerCase().includes(lowered) ||
        node.path.join('.').toLowerCase().includes(lowered) ||
        node.preview.toLowerCase().includes(lowered);

      const childMatches = treeFilter(node.children || [], query);
      if (selfMatch || childMatches.length > 0) {
        return {
          ...node,
          children: childMatches,
        };
      }
      return null;
    })
    .filter(Boolean);
}

function TreeNode({ node, expanded, onToggle, onSelect, selectedId, depth }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      {
        className: `tree-row ${isSelected ? 'selected' : ''}`,
        style: { paddingLeft: `${depth * 14 + 8}px` },
      },
      hasChildren
        ? React.createElement(
            'button',
            {
              className: 'tree-toggle',
              onClick: () => onToggle(node.id),
              type: 'button',
            },
            isExpanded ? '▾' : '▸'
          )
        : React.createElement('span', { className: 'tree-toggle-placeholder' }, '•'),
      React.createElement(
        'button',
        {
          className: 'tree-key',
          onClick: () => onSelect(node),
          type: 'button',
        },
        node.key
      ),
      React.createElement('span', { className: 'tree-type' }, node.type),
      React.createElement('span', { className: 'tree-preview' }, node.preview)
    ),
    hasChildren && isExpanded
      ? node.children.map((child) =>
          React.createElement(TreeNode, {
            key: child.id,
            node: child,
            expanded,
            onToggle,
            onSelect,
            selectedId,
            depth: depth + 1,
          })
        )
      : null
  );
}

function DomainList({ domains, filter, onFilterChange, onSelect, selected }) {
  const filtered = domains.filter((domain) =>
    domain.toLowerCase().includes(filter.toLowerCase())
  );

  return React.createElement(
    'section',
    { className: 'panel domain-panel' },
    React.createElement('h2', null, 'Domains'),
    React.createElement('input', {
      className: 'input',
      placeholder: 'Filter domains',
      value: filter,
      onChange: (event) => onFilterChange(event.target.value),
    }),
    React.createElement(
      'div',
      { className: 'domain-list' },
      filtered.map((domain) =>
        React.createElement(
          'button',
          {
            key: domain,
            className: `domain-button ${selected === domain ? 'selected' : ''}`,
            onClick: () => onSelect(domain),
            type: 'button',
          },
          domain
        )
      )
    )
  );
}

function DetailsPanel({ domain, selectedNode, keyType, rawValue, parseError }) {
  const displayValue =
    selectedNode && selectedNode.value !== null
      ? String(selectedNode.value)
      : selectedNode
      ? selectedNode.preview
      : rawValue;

  return React.createElement(
    'section',
    { className: 'panel details-panel' },
    React.createElement('h2', null, 'Details'),
    domain ? React.createElement('p', { className: 'meta' }, `Domain: ${domain}`) : null,
    selectedNode
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement('p', { className: 'meta' }, `Path: ${selectedNode.path.join('.')}`),
          React.createElement('p', { className: 'meta' }, `Type: ${selectedNode.type}`),
          keyType ? React.createElement('p', { className: 'meta' }, `read-type: ${keyType}`) : null
        )
      : React.createElement('p', { className: 'meta' }, 'Select a key in the tree to inspect it.'),
    parseError ? React.createElement('p', { className: 'error' }, parseError) : null,
    React.createElement('pre', { className: 'detail-value' }, displayValue || '')
  );
}

function App() {
  const [domains, setDomains] = React.useState([]);
  const [domainsError, setDomainsError] = React.useState('');
  const [domainFilter, setDomainFilter] = React.useState('');
  const [selectedDomain, setSelectedDomain] = React.useState('');
  const [tree, setTree] = React.useState([]);
  const [rawDomain, setRawDomain] = React.useState('');
  const [parseError, setParseError] = React.useState('');
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [expanded, setExpanded] = React.useState(new Set());
  const [treeFilterText, setTreeFilterText] = React.useState('');
  const [keyType, setKeyType] = React.useState('');
  const [findQuery, setFindQuery] = React.useState('');
  const [findOutput, setFindOutput] = React.useState('');
  const [status, setStatus] = React.useState('Loading domains...');

  React.useEffect(() => {
    async function loadDomains() {
      const response = await window.defaultsApi.listDomains();
      if (response.error) {
        setDomainsError(response.error);
        setStatus('Failed to load domains.');
        return;
      }

      setDomains(response.domains || []);
      setStatus(`Loaded ${response.domains?.length || 0} domains.`);
    }

    loadDomains();
  }, []);

  React.useEffect(() => {
    if (!selectedDomain) return;
    async function loadDomain() {
      setStatus(`Loading ${selectedDomain}...`);
      const response = await window.defaultsApi.readDomain(selectedDomain);

      if (response.error) {
        setStatus(`Error: ${response.error}`);
        return;
      }

      setRawDomain(response.raw || '');
      setTree(response.tree || []);
      setParseError(response.parseError || '');
      setSelectedNode(null);
      setKeyType('');
      setExpanded(new Set());
      setStatus(`Loaded ${selectedDomain}.`);
    }

    loadDomain();
  }, [selectedDomain]);

  async function selectNode(node) {
    setSelectedNode(node);
    if (!selectedDomain) return;

    const keyPath = node.path.join('.');
    if (!keyPath) return;

    const typeResponse = await window.defaultsApi.readType(selectedDomain, keyPath);
    setKeyType(typeResponse.error ? typeResponse.error : typeResponse.type || '');
  }

  function toggleNode(id) {
    setExpanded((current) => {
      const copy = new Set(current);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  async function runFind(event) {
    event.preventDefault();
    if (!findQuery.trim()) return;
    setStatus(`Searching for "${findQuery}"...`);
    const response = await window.defaultsApi.find(findQuery.trim());
    if (response.error) {
      setFindOutput(response.error);
      setStatus('Search failed.');
      return;
    }

    setFindOutput(response.raw || '');
    setStatus(`Search complete for "${findQuery}".`);
  }

  const filteredTree = React.useMemo(
    () => treeFilter(tree, treeFilterText),
    [tree, treeFilterText]
  );

  return React.createElement(
    'main',
    { className: 'app' },
    React.createElement(
      'header',
      { className: 'app-header' },
      React.createElement('h1', null, 'Defaults Explorer'),
      React.createElement(
        'form',
        { className: 'find-form', onSubmit: runFind },
        React.createElement('input', {
          className: 'input',
          value: findQuery,
          onChange: (event) => setFindQuery(event.target.value),
          placeholder: 'defaults find <word>',
        }),
        React.createElement(
          'button',
          { className: 'button', type: 'submit' },
          'Find'
        )
      )
    ),
    React.createElement(
      'p',
      { className: 'status' },
      domainsError ? `Error: ${domainsError}` : status
    ),
    React.createElement(
      'section',
      { className: 'layout' },
      React.createElement(DomainList, {
        domains,
        filter: domainFilter,
        onFilterChange: setDomainFilter,
        onSelect: setSelectedDomain,
        selected: selectedDomain,
      }),
      React.createElement(
        'section',
        { className: 'panel tree-panel' },
        React.createElement('h2', null, 'Tree'),
        React.createElement('input', {
          className: 'input',
          value: treeFilterText,
          onChange: (event) => setTreeFilterText(event.target.value),
          placeholder: 'Filter keys or values',
        }),
        React.createElement(
          'div',
          { className: 'tree-container' },
          filteredTree.length === 0
            ? React.createElement('p', { className: 'meta' }, 'No keys to display.')
            : filteredTree.map((node) =>
                React.createElement(TreeNode, {
                  key: node.id,
                  node,
                  expanded,
                  onToggle: toggleNode,
                  onSelect: selectNode,
                  selectedId: selectedNode ? selectedNode.id : '',
                  depth: 0,
                })
              )
        )
      ),
      React.createElement(DetailsPanel, {
        domain: selectedDomain,
        selectedNode,
        keyType,
        rawValue: rawDomain,
        parseError,
      })
    ),
    React.createElement(
      'section',
      { className: 'panel find-results' },
      React.createElement('h2', null, 'Find Results'),
      React.createElement(
        'pre',
        { className: 'find-output' },
        findOutput || 'Run a search to inspect matching defaults entries.'
      )
    )
  );
}

module.exports = {
  App,
};
