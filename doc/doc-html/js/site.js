// TON File Specification - Site JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize syntax highlighting
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }

    // Add copy buttons to code blocks
    addCopyButtons();

    // Initialize search functionality
    initializeSearch();

    // Set active navigation item
    setActiveNavigation();

    // Handle mobile sidebar toggle
    initializeMobileSidebar();

    // Smooth scroll for anchor links
    initializeSmoothScroll();
});

// Add copy buttons to all code blocks
function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre');

    codeBlocks.forEach(block => {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);

        const button = document.createElement('button');
        button.className = 'copy-button';
        button.textContent = 'Copy';
        wrapper.appendChild(button);

        button.addEventListener('click', () => {
            const code = block.querySelector('code');
            const text = code ? code.textContent : block.textContent;

            navigator.clipboard.writeText(text).then(() => {
                button.textContent = 'Copied!';
                button.classList.add('copied');

                setTimeout(() => {
                    button.textContent = 'Copy';
                    button.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    });
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    let searchIndex = null;

    // Load search index
    fetch('/search-index.json')
        .then(response => response.json())
        .then(data => {
            searchIndex = data;
        })
        .catch(err => {
            console.error('Failed to load search index:', err);
        });

    // Handle search input
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (query.length < 2) {
            hideSearchResults();
            return;
        }

        if (!searchIndex) {
            return;
        }

        const results = searchDocuments(query, searchIndex);
        displaySearchResults(results);
    });

    // Handle escape key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            hideSearchResults();
        }
    });
}

function searchDocuments(query, index) {
    const results = [];

    index.forEach(doc => {
        let score = 0;

        // Check title
        if (doc.title.toLowerCase().includes(query)) {
            score += 10;
        }

        // Check content
        if (doc.content && doc.content.toLowerCase().includes(query)) {
            score += 5;
        }

        // Check keywords
        if (doc.keywords) {
            doc.keywords.forEach(keyword => {
                if (keyword.toLowerCase().includes(query)) {
                    score += 3;
                }
            });
        }

        if (score > 0) {
            results.push({
                ...doc,
                score: score
            });
        }
    });

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 10); // Return top 10 results
}

function displaySearchResults(results) {
    // Remove existing results container
    hideSearchResults();

    if (results.length === 0) {
        return;
    }

    const searchBox = document.querySelector('.search-box');
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results';
    resultsContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid var(--code-border);
        border-radius: 4px;
        margin-top: 0.5rem;
        max-height: 400px;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    `;

    results.forEach(result => {
        const item = document.createElement('a');
        item.href = result.url;
        item.className = 'search-result-item';
        item.style.cssText = `
            display: block;
            padding: 0.75rem 1rem;
            color: var(--text-color);
            text-decoration: none;
            border-bottom: 1px solid var(--border-color);
        `;
        item.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 0.25rem;">${result.title}</div>
            <div style="font-size: 0.85rem; color: #6c757d;">${result.description || ''}</div>
        `;

        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = 'var(--code-bg)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });

        resultsContainer.appendChild(item);
    });

    searchBox.appendChild(resultsContainer);
}

function hideSearchResults() {
    const existingResults = document.querySelector('.search-results');
    if (existingResults) {
        existingResults.remove();
    }
}

// Set active navigation item based on current page
function setActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar-nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        }
    });
}

// Initialize mobile sidebar toggle
function initializeMobileSidebar() {
    // Create mobile menu button if not exists
    const header = document.querySelector('.header');
    const sidebar = document.getElementById('sidebar');

    if (!header || !sidebar) return;

    // Check if mobile
    if (window.innerWidth > 768) return;

    const menuButton = document.createElement('button');
    menuButton.className = 'mobile-menu-button';
    menuButton.innerHTML = '☰';
    menuButton.style.cssText = `
        display: none;
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        margin-right: 1rem;
    `;

    header.insertBefore(menuButton, header.firstChild);

    // Show button on mobile
    if (window.innerWidth <= 768) {
        menuButton.style.display = 'block';
    }

    menuButton.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuButton.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            menuButton.style.display = 'none';
            sidebar.classList.remove('active');
        } else {
            menuButton.style.display = 'block';
        }
    });
}

// Smooth scroll for anchor links
function initializeSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const headerHeight = 80; // Account for fixed header
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Custom syntax highlighting for TON format
if (typeof Prism !== 'undefined') {
    Prism.languages.ton = {
        'comment': [
            {
                pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
                lookbehind: true
            },
            {
                pattern: /(^|[^\\:])\/\/.*/,
                lookbehind: true
            }
        ],
        'string': [
            {
                pattern: /"""[\s\S]*?"""/,
                greedy: true
            },
            {
                pattern: /'''[\s\S]*?'''/,
                greedy: true
            },
            {
                pattern: /"(?:[^"\\]|\\.)*"/,
                greedy: true
            },
            {
                pattern: /'(?:[^'\\]|\\.)*'/,
                greedy: true
            }
        ],
        'class-name': {
            pattern: /\(([^)]+)\)/,
            inside: {
                'punctuation': /[()]/
            }
        },
        'property': {
            pattern: /(@?\w+)\s*=/,
            lookbehind: false
        },
        'number': [
            /\b0x[0-9a-fA-F]+\b/,
            /\b0b[01]+\b/,
            /\b\d+\.?\d*(?:[eE][+-]?\d+)?\b/
        ],
        'boolean': /\b(?:true|false)\b/,
        'null': /\b(?:null|undefined)\b/,
        'enum': {
            pattern: /\|[^|]*\|/,
            inside: {
                'punctuation': /\|/
            }
        },
        'guid': /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/,
        'keyword': /\b(?:enum|enumSet|required|string|int|float|boolean|array|guid|date)\b/,
        'punctuation': /[{}\[\],=]/,
        'schema': {
            pattern: /#[@!].*/,
            inside: {
                'punctuation': /#[@!]/
            }
        }
    };
}