import { state, getVisualRange } from '../state.js';

export function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function render() {
    const content = document.getElementById('editor-content');
    const lineNums = document.getElementById('line-numbers');
    const mode = state.mode;
    const isVisual = mode === 'VISUAL' || mode === 'V-LINE' || mode === 'V-BLOCK';

    let contentHtml = '';
    let numHtml = '';
    const r = state.cursorRow;
    const c = state.cursorCol;
    const { start: vStart, end: vEnd } = isVisual ? getVisualRange() : { start: null, end: null };

    state.lines.forEach((line, ri) => {
        const isCurrent = ri === r;
        numHtml += `<span class="${isCurrent ? 'current' : ''}">${ri + 1}</span>`;

        if (isCurrent && !isVisual) {
            const safeCol = Math.min(c, line.length);
            const before = escapeHtml(line.slice(0, safeCol));
            const cursorChar = line[safeCol] || ' ';
            const cursorSafe = escapeHtml(cursorChar);
            const after = escapeHtml(line.slice(safeCol + 1));
            const insertClass = mode === 'INSERT' ? 'insert-cursor' : '';
            contentHtml += `<span class="editor-line current-line">${before}<span class="vim-cursor ${insertClass}">${cursorSafe}</span>${after}</span>`;
        } else if (isVisual) {
            let lineHtml = `<span class="editor-line${isCurrent ? ' current-line' : ''}">`;
            if (mode === 'V-LINE' && ri >= vStart.row && ri <= vEnd.row) {
                lineHtml += `<span class="visual-selection">${escapeHtml(line) || ' '}</span>`;
            } else if (mode === 'VISUAL' && ri >= vStart.row && ri <= vEnd.row) {
                const cs = ri === vStart.row ? vStart.col : 0;
                const ce = ri === vEnd.row ? vEnd.col + 1 : line.length;
                lineHtml += `${escapeHtml(line.slice(0, cs))}<span class="visual-selection">${escapeHtml(line.slice(cs, ce)) || ' '}</span>${escapeHtml(line.slice(ce))}`;
            } else {
                lineHtml += escapeHtml(line);
            }
            lineHtml += '</span>';
            contentHtml += lineHtml;
        } else {
            contentHtml += `<span class="editor-line">${escapeHtml(line)}</span>`;
        }
    });

    content.innerHTML = contentHtml;
    lineNums.innerHTML = numHtml;
    const lines = content.querySelectorAll('.editor-line');
    if (lines[r]) lines[r].scrollIntoView({ block: 'nearest' });
}

export function updateUI() {
    document.getElementById('sl-position').textContent = `${state.cursorRow + 1}:${state.cursorCol + 1}`;
    document.getElementById('sl-filename').textContent = `${state.currentFile}${state.modified ? ' [+]' : ''}`;
    const clipText = state.clipboard.text;
    document.getElementById('sl-clipboard').textContent = clipText ? `reg: "${clipText.slice(0, 8)}${clipText.length > 8 ? '…' : ''}"` : 'reg: ""';
    // Actualizar hints en teclado virtual
    import('../keyboard/virtualKeyboard.js').then(vk => vk.updateKeyHints());
}

export function setInfo(title, detail, cmd, type) {
    document.getElementById('desc-main').textContent = title;
    document.getElementById('desc-detail').textContent = detail;
    updateCmdDisplay(cmd || '');
}

let msgTimeout;
export function showMsg(msg) {
    const el = document.getElementById('cmd-msg');
    if (el) el.textContent = msg;
    clearTimeout(msgTimeout);
    msgTimeout = setTimeout(() => {
        if (state.mode === 'NORMAL' && el) el.textContent = '';
    }, 3000);
}

export function updateCmdDisplay(cmd) {
    document.getElementById('cmd-display').textContent = cmd;
}
