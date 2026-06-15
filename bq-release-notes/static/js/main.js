// BigQuery Release Pulse - Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let allReleases = [];
    let selectedReleaseId = null;
    let currentFilterType = 'all';
    let currentSearchQuery = '';

    // DOM Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const btnRetry = document.getElementById('btn-retry');
    const searchInput = document.getElementById('search-input');
    const filterPills = document.querySelectorAll('.filter-pill');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const emptyState = document.getElementById('empty-state');
    const releasesGrid = document.getElementById('releases-grid');
    
    // Stats
    const statLastChecked = document.getElementById('stat-last-checked');
    const statTotalCount = document.getElementById('stat-total-count');

    // Selection Dock
    const selectionDock = document.getElementById('selection-dock');
    const dockSelectedCount = document.getElementById('dock-selected-count');
    const btnClearSelection = document.getElementById('btn-clear-selection');
    const btnTweetSelected = document.getElementById('btn-tweet-selected');

    // Tweet Modal
    const tweetModal = document.getElementById('tweet-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const btnPublishTweet = document.getElementById('btn-publish-tweet');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const warningLimit = document.getElementById('warning-limit');
    const tweetSourceLinkText = document.getElementById('tweet-source-link-text');

    // Initial Fetch
    fetchReleases(false);

    // Event Listeners
    btnRefresh.addEventListener('click', () => fetchReleases(true));
    btnRetry.addEventListener('click', () => fetchReleases(true));
    
    // Search filter
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase().strip();
        renderFilteredReleases();
    });

    // Pill filters
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilterType = pill.getAttribute('data-type');
            renderFilteredReleases();
        });
    });

    // Clear Selection
    btnClearSelection.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelection();
    });

    // Tweet Selected from Dock
    btnTweetSelected.addEventListener('click', () => {
        if (selectedReleaseId) {
            const release = allReleases.find(r => r.id === selectedReleaseId);
            if (release) {
                openTweetModal(release);
            }
        }
    });

    // Modal Close handlers
    btnCloseModal.addEventListener('click', closeTweetModal);
    btnCancelModal.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });

    // Textarea input character count
    tweetTextarea.addEventListener('input', () => {
        const count = tweetTextarea.value.length;
        charCounter.textContent = `${count} / 280`;
        
        if (count > 280) {
            charCounter.style.color = '#f87171';
            warningLimit.classList.remove('hidden');
            btnPublishTweet.disabled = true;
            btnPublishTweet.style.opacity = 0.5;
            btnPublishTweet.style.pointerEvents = 'none';
        } else {
            charCounter.style.color = '#64748b';
            warningLimit.classList.add('hidden');
            btnPublishTweet.disabled = false;
            btnPublishTweet.style.opacity = 1;
            btnPublishTweet.style.pointerEvents = 'all';
        }
    });

    // Publish Tweet (X Intent redirect)
    btnPublishTweet.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(xUrl, '_blank', 'noopener,noreferrer');
        closeTweetModal();
    });

    // Helper functions
    String.prototype.strip = function() {
        return this.replace(/^\s+|\s+$/g, '');
    };

    function fetchReleases(forceRefresh = false) {
        // UI loading state
        btnRefresh.classList.add('loading');
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        emptyState.classList.add('hidden');
        releasesGrid.classList.add('hidden');
        
        if (forceRefresh) {
            clearSelection();
        }

        const url = `/api/releases?refresh=${forceRefresh}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server returned status ${response.status}`);
                }
                return response.json();
            })
            .then(res => {
                if (res.status === 'success') {
                    allReleases = res.data;
                    
                    // Update stats
                    const now = new Date();
                    statLastChecked.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    statTotalCount.textContent = allReleases.length;
                    
                    renderFilteredReleases();
                } else {
                    throw new Error(res.message || 'Unknown server error');
                }
            })
            .catch(err => {
                console.error("Fetch Error:", err);
                errorMessage.textContent = err.message || 'We encountered a problem fetching the XML release notes feed.';
                errorState.classList.remove('hidden');
            })
            .finally(() => {
                btnRefresh.classList.remove('loading');
                loadingState.classList.add('hidden');
            });
    }

    function renderFilteredReleases() {
        releasesGrid.innerHTML = '';
        
        // Filter logic
        const filtered = allReleases.filter(release => {
            // Type match
            let typeMatch = false;
            if (currentFilterType === 'all') {
                typeMatch = true;
            } else if (currentFilterType === 'Other') {
                typeMatch = !['Feature', 'Changed', 'Deprecated'].includes(release.type);
            } else {
                typeMatch = release.type.toLowerCase() === currentFilterType.toLowerCase();
            }
            
            // Search query match
            let searchMatch = true;
            if (currentSearchQuery) {
                const text = release.content_text.toLowerCase();
                const type = release.type.toLowerCase();
                const date = release.date.toLowerCase();
                searchMatch = text.includes(currentSearchQuery) || 
                              type.includes(currentSearchQuery) || 
                              date.includes(currentSearchQuery);
            }
            
            return typeMatch && searchMatch;
        });

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            releasesGrid.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        releasesGrid.classList.remove('hidden');

        // Render card elements
        filtered.forEach(release => {
            const card = document.createElement('article');
            card.className = `release-card ${selectedReleaseId === release.id ? 'selected' : ''}`;
            card.dataset.id = release.id;
            
            // Map types to badge classes
            let badgeClass = 'badge-other';
            const lowerType = release.type.toLowerCase();
            if (lowerType === 'feature') badgeClass = 'badge-feature';
            else if (lowerType === 'changed') badgeClass = 'badge-changed';
            else if (lowerType === 'deprecated') badgeClass = 'badge-deprecated';

            card.innerHTML = `
                <div class="card-selector" title="Select this update">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <header class="card-header">
                    <span class="badge ${badgeClass}">${release.type}</span>
                    <time class="card-date">${release.date}</time>
                </header>
                <div class="card-body">
                    ${release.content_html}
                </div>
                <footer class="card-actions">
                    <button class="btn-card-action copy-link" data-link="${release.link}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        Copy Link
                    </button>
                    <button class="btn-card-action tweet" data-id="${release.id}">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Tweet
                    </button>
                </footer>
            `;

            // Toggle select on card click
            card.addEventListener('click', (e) => {
                // If they clicked an anchor tag or button inside card, don't toggle selection
                if (e.target.closest('a') || e.target.closest('.btn-card-action')) {
                    return;
                }
                toggleCardSelection(release.id);
            });

            // Card Tweet button handler
            card.querySelector('.btn-card-action.tweet').addEventListener('click', (e) => {
                e.stopPropagation();
                openTweetModal(release);
            });

            // Card Copy Link button handler
            card.querySelector('.btn-card-action.copy-link').addEventListener('click', (e) => {
                e.stopPropagation();
                const btn = e.currentTarget;
                const link = btn.getAttribute('data-link');
                navigator.clipboard.writeText(link).then(() => {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Copied!
                    `;
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                    }, 2000);
                });
            });

            releasesGrid.appendChild(card);
        });
    }

    function toggleCardSelection(id) {
        const prevSelected = selectedReleaseId;
        
        if (selectedReleaseId === id) {
            clearSelection();
        } else {
            selectedReleaseId = id;
            
            // Update UI cards classes
            document.querySelectorAll('.release-card').forEach(card => {
                if (card.dataset.id === id) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            });

            // Update floating dock
            dockSelectedCount.textContent = "1 Update Selected";
            selectionDock.classList.add('active');
        }
    }

    function clearSelection() {
        selectedReleaseId = null;
        document.querySelectorAll('.release-card').forEach(card => {
            card.classList.remove('selected');
        });
        selectionDock.classList.remove('active');
    }

    function openTweetModal(release) {
        // Construct smart tweet draft text
        const prefix = `🚀 BigQuery Update [${release.type}] (${release.date}):\n\n`;
        const link = `\n\nRead more: ${release.link}`;
        
        // Calculate maximum space available for description text
        // 280 chars total limit
        const reservedLen = prefix.length + link.length;
        const maxDescLen = 280 - reservedLen;
        
        let desc = release.content_text;
        
        // Truncate description if needed
        if (desc.length > maxDescLen) {
            desc = desc.substring(0, maxDescLen - 3) + "...";
        }
        
        const fullTweetText = `${prefix}${desc}${link}`;
        
        tweetTextarea.value = fullTweetText;
        tweetSourceLinkText.textContent = release.link;
        
        // Trigger character counter check
        tweetTextarea.dispatchEvent(new Event('input'));
        
        tweetModal.classList.add('active');
        tweetTextarea.focus();
    }

    function closeTweetModal() {
        tweetModal.classList.remove('active');
    }
});
