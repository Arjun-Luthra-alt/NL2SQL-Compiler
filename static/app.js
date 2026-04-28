/**
 * NL2SQL Compiler - Chat Application JavaScript
 * Sprint 2: Added data visualization and CSV export
 */

// ==========================================
// State Management
// ==========================================

const state = {
    currentSessionId: null,
    sessions: [],
    isLoading: false,
    currentChartData: null,
    chartInstance: null
};

// ==========================================
// DOM Elements
// ==========================================

const elements = {
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    menuToggle: document.getElementById('menuToggle'),
    newChatBtn: document.getElementById('newChatBtn'),
    sessionsList: document.getElementById('sessionsList'),
    schemaBtn: document.getElementById('schemaBtn'),

    // Chat
    chatTitle: document.getElementById('chatTitle'),
    chatMessages: document.getElementById('chatMessages'),
    welcomeContainer: document.getElementById('welcomeContainer'),
    suggestions: document.getElementById('suggestions'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),

    // Modals
    schemaModal: document.getElementById('schemaModal'),
    closeSchemaModal: document.getElementById('closeSchemaModal'),
    schemaContent: document.getElementById('schemaContent'),
    chartModal: document.getElementById('chartModal'),
    closeChartModal: document.getElementById('closeChartModal'),
    chartType: document.getElementById('chartType'),
    dataChart: document.getElementById('dataChart')
};

// ==========================================
// API Functions
// ==========================================

const api = {
    async chat(message, sessionId = null) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, session_id: sessionId })
        });
        return response.json();
    },

    async getSessions() {
        const response = await fetch('/api/sessions');
        return response.json();
    },

    async getSession(sessionId) {
        const response = await fetch(`/api/sessions/${sessionId}`);
        return response.json();
    },

    async deleteSession(sessionId) {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        return response.json();
    },

    async getSchema() {
        const response = await fetch('/api/schema');
        return response.json();
    },

    async exportCsv(columns, rows, filename = 'export') {
        const response = await fetch('/api/export/csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ columns, rows, filename })
        });
        return response.blob();
    }
};

// ==========================================
// UI Functions
// ==========================================

function renderSessions() {
    if (state.sessions.length === 0) {
        elements.sessionsList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p>No conversations yet</p>
            </div>
        `;
        return;
    }

    const html = state.sessions.map(session => `
        <div class="session-item ${session.session_id === state.currentSessionId ? 'active' : ''}" 
             data-session-id="${session.session_id}">
            <div class="session-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </div>
            <div class="session-info">
                <div class="session-title">${session.title || 'New Chat'}</div>
                <div class="session-date">${formatDate(session.updated_at)}</div>
            </div>
            <button class="session-delete" data-session-id="${session.session_id}" title="Delete">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        </div>
    `).join('');

    elements.sessionsList.innerHTML = html;

    // Add click handlers
    elements.sessionsList.querySelectorAll('.session-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            if (e.target.closest('.session-delete')) {
                e.stopPropagation();
                const sessionId = e.target.closest('.session-delete').dataset.sessionId;
                await deleteSession(sessionId);
            } else {
                const sessionId = item.dataset.sessionId;
                await loadSession(sessionId);
            }
        });
    });
}

function renderMessage(role, content, sqlQuery = null, data = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatarIcon = role === 'user'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>';

    let extraContent = '';

    // Add SQL display if present
    if (sqlQuery) {
        extraContent += `
            <div class="sql-display">
                <div class="sql-header">
                    <span class="sql-label">Generated SQL</span>
                    <button class="copy-btn" onclick="copyToClipboard(\`${escapeHtml(sqlQuery)}\`)" title="Copy">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                </div>
                <div class="sql-code">${escapeHtml(sqlQuery)}</div>
            </div>
        `;
    }

    // Add data table if present
    if (data && data.columns && data.rows && data.rows.length > 0) {
        const maxRows = 10;
        const displayRows = data.rows.slice(0, maxRows);
        const dataId = Date.now();

        extraContent += `
            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${data.columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${displayRows.map(row => `
                            <tr>
                                ${row.map(cell => `<td>${escapeHtml(String(cell ?? ''))}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        if (data.rows.length > maxRows) {
            extraContent += `
                <div class="row-count-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    Showing ${maxRows} of ${data.row_count} rows
                </div>
            `;
        }

        // Add action buttons
        extraContent += `
            <div class="data-actions">
                <button class="action-btn" onclick='exportData(${JSON.stringify(data.columns)}, ${JSON.stringify(data.rows)})'>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Export CSV
                </button>
                <button class="action-btn primary" onclick='showChart(${JSON.stringify(data.columns)}, ${JSON.stringify(data.rows)})'>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                    Visualize
                </button>
            </div>
        `;
    }

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatarIcon}</div>
        <div class="message-content">
            <div class="message-bubble">${formatMessage(content)}</div>
            ${extraContent}
        </div>
    `;

    return messageDiv;
}

function renderTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = 'typingIndicator';

    messageDiv.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
            </svg>
        </div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;

    return messageDiv;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function renderSuggestions(suggestions) {
    const html = suggestions.map(suggestion => `
        <button class="suggestion-chip">${escapeHtml(suggestion)}</button>
    `).join('');

    elements.suggestions.innerHTML = html;

    // Add click handlers
    elements.suggestions.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            elements.messageInput.value = chip.textContent;
            elements.sendBtn.disabled = false;
            elements.messageInput.focus();
        });
    });
}

// ==========================================
// Chart Functions
// ==========================================

function showChart(columns, rows) {
    state.currentChartData = { columns, rows };
    elements.chartModal.classList.add('active');
    renderChart('bar');
}

function renderChart(type) {
    const { columns, rows } = state.currentChartData;

    // Destroy existing chart if any
    if (state.chartInstance) {
        state.chartInstance.destroy();
    }

    // Find suitable columns for charting
    // First column with text = labels, numeric columns = data
    let labelColumn = 0;
    let dataColumns = [];

    // Detect column types from first row
    if (rows.length > 0) {
        columns.forEach((col, idx) => {
            const value = rows[0][idx];
            if (typeof value === 'number' || !isNaN(parseFloat(value))) {
                dataColumns.push(idx);
            } else if (dataColumns.length === 0) {
                labelColumn = idx;
            }
        });
    }

    // If no numeric columns found, use row indices
    if (dataColumns.length === 0) {
        dataColumns = [1]; // Try second column
    }

    // Prepare data
    const labels = rows.slice(0, 20).map(row => String(row[labelColumn] || '').substring(0, 20));
    const datasets = dataColumns.slice(0, 3).map((colIdx, i) => {
        const colors = [
            { bg: 'rgba(99, 102, 241, 0.7)', border: 'rgb(99, 102, 241)' },
            { bg: 'rgba(34, 211, 238, 0.7)', border: 'rgb(34, 211, 238)' },
            { bg: 'rgba(168, 85, 247, 0.7)', border: 'rgb(168, 85, 247)' }
        ];

        return {
            label: columns[colIdx],
            data: rows.slice(0, 20).map(row => parseFloat(row[colIdx]) || 0),
            backgroundColor: type === 'pie' || type === 'doughnut'
                ? generateColors(rows.length)
                : colors[i % colors.length].bg,
            borderColor: type === 'pie' || type === 'doughnut'
                ? generateColors(rows.length, 1)
                : colors[i % colors.length].border,
            borderWidth: 2
        };
    });

    const ctx = elements.dataChart.getContext('2d');

    state.chartInstance = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: type === 'pie' || type === 'doughnut' ? 'right' : 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Inter' }
                    }
                },
                title: {
                    display: true,
                    text: 'Data Visualization',
                    color: '#f8fafc',
                    font: { family: 'Inter', size: 16 }
                }
            },
            scales: type === 'pie' || type === 'doughnut' ? {} : {
                x: {
                    ticks: { color: '#64748b' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                },
                y: {
                    ticks: { color: '#64748b' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                }
            }
        }
    });
}

function generateColors(count, alpha = 0.7) {
    const baseColors = [
        `rgba(99, 102, 241, ${alpha})`,
        `rgba(34, 211, 238, ${alpha})`,
        `rgba(168, 85, 247, ${alpha})`,
        `rgba(16, 185, 129, ${alpha})`,
        `rgba(245, 158, 11, ${alpha})`,
        `rgba(239, 68, 68, ${alpha})`,
        `rgba(236, 72, 153, ${alpha})`,
        `rgba(59, 130, 246, ${alpha})`
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

// ==========================================
// Export Functions
// ==========================================

async function exportData(columns, rows) {
    try {
        const blob = await api.exportCsv(columns, rows, 'query_results');

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'query_results.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('CSV exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export CSV', 'error');
    }
}

function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// Core Functions
// ==========================================

async function sendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message || state.isLoading) return;

    state.isLoading = true;
    elements.sendBtn.disabled = true;

    // Hide welcome container
    if (elements.welcomeContainer) {
        elements.welcomeContainer.style.display = 'none';
    }

    // Add user message
    elements.chatMessages.appendChild(renderMessage('user', message));
    elements.messageInput.value = '';
    autoResize();

    // Add typing indicator
    elements.chatMessages.appendChild(renderTypingIndicator());
    scrollToBottom();

    try {
        const response = await api.chat(message, state.currentSessionId);

        removeTypingIndicator();

        // Update session ID
        if (response.session_id) {
            state.currentSessionId = response.session_id;
        }

        // Add assistant message
        elements.chatMessages.appendChild(
            renderMessage('assistant', response.message, response.sql_query, response.data)
        );

        // Refresh sessions list
        await loadSessions();

    } catch (error) {
        removeTypingIndicator();
        console.error('Chat error:', error);
        elements.chatMessages.appendChild(
            renderMessage('assistant', 'Sorry, I encountered an error. Please try again.')
        );
    }

    state.isLoading = false;
    elements.sendBtn.disabled = false;
    scrollToBottom();
}

async function loadSessions() {
    try {
        state.sessions = await api.getSessions();
        renderSessions();
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

async function loadSession(sessionId) {
    try {
        const session = await api.getSession(sessionId);

        state.currentSessionId = sessionId;
        elements.chatTitle.textContent = session.title || 'Conversation';

        // Clear messages
        elements.chatMessages.innerHTML = '';

        // Hide welcome container
        if (elements.welcomeContainer) {
            elements.welcomeContainer.style.display = 'none';
        }

        // Render all messages
        for (const msg of session.messages) {
            const sqlQuery = msg.metadata?.sql_query || null;
            elements.chatMessages.appendChild(renderMessage(msg.role, msg.content, sqlQuery));
        }

        scrollToBottom();
        renderSessions();
        closeSidebar();

    } catch (error) {
        console.error('Error loading session:', error);
    }
}

async function deleteSession(sessionId) {
    try {
        await api.deleteSession(sessionId);

        if (state.currentSessionId === sessionId) {
            startNewChat();
        }

        await loadSessions();
        showToast('Session deleted', 'success');
    } catch (error) {
        console.error('Error deleting session:', error);
        showToast('Failed to delete session', 'error');
    }
}

function startNewChat() {
    state.currentSessionId = null;
    elements.chatTitle.textContent = 'New Conversation';

    // Reset chat area
    elements.chatMessages.innerHTML = '';

    // Show welcome container
    if (elements.welcomeContainer) {
        elements.welcomeContainer.style.display = 'flex';
        elements.chatMessages.appendChild(elements.welcomeContainer);
    }

    renderSessions();
    closeSidebar();
}

async function showSchema() {
    elements.schemaModal.classList.add('active');

    try {
        const data = await api.getSchema();

        let html = `<pre>${escapeHtml(data.schema)}</pre>`;

        if (data.suggested_questions && data.suggested_questions.length > 0) {
            html += '<h3 style="margin-top: 1.5rem; margin-bottom: 1rem;">Suggested Questions</h3>';
            html += '<div class="suggestions">';
            html += data.suggested_questions.map(q =>
                `<button class="suggestion-chip" onclick="useSuggestion('${escapeHtml(q)}')">${escapeHtml(q)}</button>`
            ).join('');
            html += '</div>';
        }

        elements.schemaContent.innerHTML = html;

    } catch (error) {
        elements.schemaContent.innerHTML = '<p>Error loading schema</p>';
    }
}

function useSuggestion(text) {
    elements.messageInput.value = text;
    elements.sendBtn.disabled = false;
    elements.schemaModal.classList.remove('active');
    elements.messageInput.focus();
}

// ==========================================
// Utility Functions
// ==========================================

function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function formatMessage(content) {
    // Basic markdown-like formatting
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    });
}

function autoResize() {
    const textarea = elements.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function toggleSidebar() {
    elements.sidebar.classList.toggle('open');
}

function closeSidebar() {
    elements.sidebar.classList.remove('open');
}

// ==========================================
// Event Listeners
// ==========================================

// Input handling
elements.messageInput.addEventListener('input', () => {
    elements.sendBtn.disabled = !elements.messageInput.value.trim();
    autoResize();
});

elements.messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

elements.sendBtn.addEventListener('click', sendMessage);

// New chat button
elements.newChatBtn.addEventListener('click', startNewChat);

// Schema button
elements.schemaBtn.addEventListener('click', showSchema);
elements.closeSchemaModal.addEventListener('click', () => {
    elements.schemaModal.classList.remove('active');
});

// Chart modal
elements.closeChartModal.addEventListener('click', () => {
    elements.chartModal.classList.remove('active');
});

elements.chartType.addEventListener('change', (e) => {
    if (state.currentChartData) {
        renderChart(e.target.value);
    }
});

// Close modals on background click
elements.schemaModal.addEventListener('click', (e) => {
    if (e.target === elements.schemaModal) {
        elements.schemaModal.classList.remove('active');
    }
});

elements.chartModal.addEventListener('click', (e) => {
    if (e.target === elements.chartModal) {
        elements.chartModal.classList.remove('active');
    }
});

// Mobile menu toggle
elements.menuToggle.addEventListener('click', toggleSidebar);

// Close sidebar on outside click (mobile)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        !elements.sidebar.contains(e.target) &&
        !elements.menuToggle.contains(e.target)) {
        closeSidebar();
    }
});

// ==========================================
// Initialization
// ==========================================

async function init() {
    // Load sessions
    await loadSessions();

    // Load schema and suggestions
    try {
        const data = await api.getSchema();
        if (data.suggested_questions) {
            renderSuggestions(data.suggested_questions);
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
    }

    // Focus input
    elements.messageInput.focus();
}

// Start the app
init();
