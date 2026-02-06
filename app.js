(function() {
    'use strict';

    // DOM helpers
    const $ = (selector, context = document) => context.querySelector(selector);
    const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

    // Theme management
    function getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update favicon
        const favicon = $('#favicon');
        if (favicon) {
            favicon.href = theme === 'dark' ? 'D.png' : 'L.png';
        }
    }

    // Projects data
    let projectsData = null;

    // UI text
    const UI = {
        loading: "Loading projects...",
        noResults: "No projects found matching your search.",
        error: "Failed to load projects. Please try again.",
        features: "Features",
        usage: "Usage",
        links: "Links",
        open: "Open",
        details: "Details",
        close: "Close"
    };

    // Render projects
    function renderProjects(filter = '') {
        const container = $('#projectsGrid');
        if (!container || !projectsData) return;

        const searchTerm = filter.toLowerCase().trim();
        const projects = projectsData.projects || [];

        // Filter projects
        const filteredProjects = projects.filter(projectKey => {
            if (!searchTerm) return true;
            
            const project = projectsData[projectKey];
            if (!project) return false;
            
            const title = (project.title || projectKey).toLowerCase();
            const desc = (project.desc || '').toLowerCase();
            const tags = (project.tags || []).join(' ').toLowerCase();
            
            return title.includes(searchTerm) || 
                   desc.includes(searchTerm) || 
                   tags.includes(searchTerm);
        });

        // Clear container
        container.innerHTML = '';

        if (filteredProjects.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--muted);">
                    ${UI.noResults}
                </div>
            `;
            return;
        }

        // Render project cards
        filteredProjects.forEach(projectKey => {
            const project = projectsData[projectKey];
            if (!project) return;

            const card = document.createElement('div');
            card.className = 'project-card';
            card.dataset.project = projectKey;

            card.innerHTML = `
                <h3>${project.title || projectKey}</h3>
                <p>${project.desc || 'No description available.'}</p>
                <div class="project-meta">
                    <span class="project-badge">${project.stat || 'Active'}</span>
                    <div class="project-links">
                        ${project.link ? `<a href="${project.link}" target="_blank" class="project-link">${UI.open}</a>` : ''}
                        <button class="project-link ghost" data-action="details" data-project="${projectKey}">
                            ${UI.details}
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        // Attach event listeners
        attachEventListeners();
    }

    // Open project details modal
    function openModal(projectKey) {
        if (!projectsData || !projectsData[projectKey]) return;

        const project = projectsData[projectKey];
        const modalContent = $('#modalContent');
        const modal = $('#modalOverlay');

        if (!modalContent || !modal) return;

        modalContent.innerHTML = `
            <h3>${project.title || projectKey}</h3>
            <div class="modal-content">
                <p>${project.desc || 'No description available.'}</p>
                
                ${project.features && project.features.length > 0 ? `
                    <h4>${UI.features}</h4>
                    <ul>
                        ${project.features.map(feat => `<li>${feat}</li>`).join('')}
                    </ul>
                ` : ''}
                
                ${project.usage && project.usage.length > 0 ? `
                    <h4>${UI.usage}</h4>
                    <pre><code>${project.usage.join('\n')}</code></pre>
                ` : ''}
                
                ${project.links && project.links.length > 0 ? `
                    <h4>${UI.links}</h4>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">
                        ${project.links.map(link => 
                            `<a href="${link.url}" target="_blank" class="project-link">${link.label || link.url}</a>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function closeModal() {
        const modal = $('#modalOverlay');
        if (!modal) return;

        modal.classList.remove('active');
        document.body.style.overflow = '';
        $('#modalContent').innerHTML = '';
    }

    // Attach event listeners
    function attachEventListeners() {
        // Details buttons
        $$('[data-action="details"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const projectKey = btn.dataset.project;
                openModal(projectKey);
            });
        });

        // Search input
        const searchInput = $('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderProjects(e.target.value);
            });
        }

        // Theme toggle
        const themeBtn = $('#themeBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const currentTheme = getTheme();
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                setTheme(newTheme);
            });
        }

        // Modal close
        $('#modalClose').addEventListener('click', closeModal);
        $('#modalOverlay').addEventListener('click', (e) => {
            if (e.target === $('#modalOverlay')) {
                closeModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    }

    // Initialize
    async function init() {
        try {
            // Load projects data
            const response = await fetch('projects.json');
            projectsData = await response.json();
            
            // Set initial theme
            const savedTheme = localStorage.getItem('theme') || 'light';
            setTheme(savedTheme);
            
            // Render projects
            renderProjects();
            
        } catch (error) {
            console.error('Failed to initialize:', error);
            $('#projectsGrid').innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #dc2626;">
                    ${UI.error}
                </div>
            `;
        }
    }

    // Start when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();