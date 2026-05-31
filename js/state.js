// Estado global del simulador
export const state = {
    mode: 'NORMAL',
    currentFile: 'main.js',
    lines: [],
    cursorRow: 0,
    cursorCol: 0,
    pendingOp: '',
    clipboard: { text: '', type: 'char' },
    history: [],
    future: [],
    visualAnchor: { row: 0, col: 0 },
    isShiftDown: false,
    isVirtualShift: false,
    isCtrlDown: false,
    searchPattern: '',
    commandStr: '',
    savedFiles: {},
    modified: false,
};

// Funciones auxiliares de estado
export function clampRow(r) {
    return Math.max(0, Math.min(state.lines.length - 1, r));
}

export function clampCol(r, c) {
    const len = state.lines[r]?.length || 0;
    const maxCol = state.mode === 'INSERT' ? len : Math.max(0, len - 1);
    return Math.max(0, Math.min(maxCol, c));
}

export function saveHistory() {
    state.history.push({
        lines: [...state.lines],
        row: state.cursorRow,
        col: state.cursorCol,
        modified: state.modified
    });
    state.future = [];
    state.modified = true;
}

export function currentLine() {
    return state.lines[state.cursorRow] || '';
}

export function getVisualRange() {
    const a = state.visualAnchor;
    const c = { row: state.cursorRow, col: state.cursorCol };
    if (a.row < c.row || (a.row === c.row && a.col <= c.col)) {
        return { start: a, end: c };
    }
    return { start: c, end: a };
}

export function enterMode(mode) {
    const prevMode = state.mode;
    state.mode = mode;
    document.body.dataset.mode = mode;
    document.getElementById('sl-mode').textContent = mode;
    document.getElementById('mode-badge').textContent = mode;

    const modeColors = {
        'NORMAL': 'var(--blue)', 'INSERT': 'var(--green)', 'VISUAL': 'var(--orange)',
        'V-LINE': 'var(--orange)', 'V-BLOCK': 'var(--orange)',
        'COMMAND': 'var(--yellow)', 'REPLACE': 'var(--purple)'
    };
    document.getElementById('sl-position').style.background = modeColors[mode] || 'var(--blue)';

    if (mode === 'INSERT') {
        import('./utils/dom.js').then(dom => dom.setInfo('→ Modo INSERT', 'Escribe texto libremente. Presiona Esc para volver a Normal.', '', 'success'));
    } else if (mode === 'VISUAL') {
        import('./utils/dom.js').then(dom => dom.setInfo('→ Modo VISUAL', 'Muévete para seleccionar texto. d=borrar, y=copiar, c=cambiar.', '', 'visual'));
    } else if (mode === 'COMMAND') {
        import('./utils/dom.js').then(dom => dom.setInfo('→ Modo EX COMMAND', 'Escribe en la barra inferior.', '', 'command'));
    }

    if (mode === 'NORMAL' && prevMode === 'INSERT') {
        state.cursorCol = clampCol(state.cursorRow, state.cursorCol);
    }
    // Actualizar UI después de cambiar modo
    import('./editor/render.js').then(render => {
        render.updateUI();
        render.render();
    });
}

export function doSearch(forward) {
    if (!state.searchPattern) return;
    const pat = state.searchPattern;
    const total = state.lines.length;
    let startRow = forward ? state.cursorRow : state.cursorRow;
    for (let di = 1; di <= total; di++) {
        const row = (startRow + (forward ? di : total - di)) % total;
        const idx = state.lines[row].indexOf(pat);
        if (idx !== -1) {
            state.cursorRow = row;
            state.cursorCol = idx;
            import('./utils/dom.js').then(dom => dom.showMsg(`/${pat}  línea ${row + 1}`));
            return;
        }
    }
    import('./utils/dom.js').then(dom => dom.showMsg(`Patrón no encontrado: "${pat}"`));
}
