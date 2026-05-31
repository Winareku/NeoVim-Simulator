import { state, getVisualRange } from '../state.js';

export function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Resaltador de sintaxis robusto basado en tokenización secuencial (Gruvbox Edition)
function highlight(line, lang) {
    if (lang === 'js') {
        const tokenRegex = /(\/\/.*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:\\[\s\S]|[^`])*`)|(\b\d+\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)/g;
        let lastIndex = 0;
        let html = "";
        
        const keywords = new Set(['const', 'let', 'var', 'function', 'return', 'import', 'export', 'from', 'new', 'class', 'if', 'else', 'while', 'for', 'in', 'of', 'default', 'true', 'false', 'null']);
        const builtins = new Set(['console', 'window', 'document', 'Editor', 'App', 'CONFIG', 'DOMContentLoaded', 'addEventListener']);

        line.replace(tokenRegex, (match, comment, string, number, word, offset) => {
            if (offset > lastIndex) {
                html += escapeHtml(line.slice(lastIndex, offset));
            }
            if (comment) {
                html += `<span class="hl-comment">${escapeHtml(comment)}</span>`;
            } else if (string) {
                html += `<span class="hl-string">${escapeHtml(string)}</span>`;
            } else if (number) {
                html += `<span class="hl-number">${escapeHtml(number)}</span>`;
            } else if (word) {
                if (keywords.has(word)) {
                    html += `<span class="hl-keyword">${escapeHtml(word)}</span>`;
                } else if (builtins.has(word)) {
                    html += `<span class="hl-builtin">${escapeHtml(word)}</span>`;
                } else {
                    html += escapeHtml(word);
                }
            }
            lastIndex = offset + match.length;
            return match;
        });

        if (lastIndex < line.length) {
            html += escapeHtml(line.slice(lastIndex));
        }
        return html;
    } else if (lang === 'lua') {
        const tokenRegex = /(--.*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b\d+\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g;
        let lastIndex = 0;
        let html = "";
        
        const keywords = new Set(['local', 'function', 'return', 'if', 'then', 'else', 'elseif', 'end', 'true', 'false', 'nil', 'for', 'in', 'do']);
        const builtins = new Set(['vim', 'opt', 'g', 'keymap', 'set', 'map']);

        line.replace(tokenRegex, (match, comment, string, number, word, offset) => {
            if (offset > lastIndex) {
                html += escapeHtml(line.slice(lastIndex, offset));
            }
            if (comment) {
                html += `<span class="hl-comment">${escapeHtml(comment)}</span>`;
            } else if (string) {
                html += `<span class="hl-string">${escapeHtml(string)}</span>`;
            } else if (number) {
                html += `<span class="hl-number">${escapeHtml(number)}</span>`;
            } else if (word) {
                if (keywords.has(word)) {
                    html += `<span class="hl-keyword">${escapeHtml(word)}</span>`;
                } else if (builtins.has(word)) {
                    html += `<span class="hl-builtin">${escapeHtml(word)}</span>`;
                } else {
                    html += escapeHtml(word);
                }
            }
            lastIndex = offset + match.length;
            return match;
        });

        if (lastIndex < line.length) {
            html += escapeHtml(line.slice(lastIndex));
        }
        return html;
    } else if (lang === 'md') {
        let html = "";
        if (line.startsWith('#')) {
            html = `<span class="hl-header">${escapeHtml(line)}</span>`;
        } else {
            const tokenRegex = /(\*\*.*?\*\*|__.*?__)|(`.*?`)|(^[\s]*[-*+]\s|^[\s]*\d+\.\s)/g;
            let lastIndex = 0;
            
            line.replace(tokenRegex, (match, bold, code, list, offset) => {
                if (offset > lastIndex) {
                    html += escapeHtml(line.slice(lastIndex, offset));
                }
                if (bold) {
                    html += `<span class="hl-bold">${escapeHtml(bold)}</span>`;
                } else if (code) {
                    html += `<span class="hl-code">${escapeHtml(code)}</span>`;
                } else if (list) {
                    html += `<span class="hl-list">${escapeHtml(list)}</span>`;
                }
                lastIndex = offset + match.length;
                return match;
            });

            if (lastIndex < line.length) {
                html += escapeHtml(line.slice(lastIndex));
            }
        }
        return html;
    }
    return escapeHtml(line);
}

// Inyecta el cursor Vim respetando etiquetas HTML de sintaxis
function injectCursor(html, col) {
    let result = "";
    let plainIndex = 0;
    let i = 0;
    let inTag = false;
    let cursorInjected = false;
    let cursorClosed = false;
    const insertClass = state.mode === 'INSERT' ? 'insert-cursor' : '';

    while (i < html.length) {
        if (html[i] === '<') {
            inTag = true;
            result += html[i];
            i++;
            continue;
        }
        if (html[i] === '>') {
            inTag = false;
            result += html[i];
            i++;
            continue;
        }
        if (inTag) {
            result += html[i];
            i++;
            continue;
        }

        // Detectar entidades HTML como un solo caracter plano (ej. &lt;)
        let entityLen = 1;
        if (html[i] === '&') {
            const semi = html.indexOf(';', i);
            if (semi !== -1 && semi - i < 8) {
                entityLen = semi - i + 1;
            }
        }

        // Inyectar apertura del cursor
        if (plainIndex === col && !cursorInjected) {
            result += `<span class="vim-cursor ${insertClass}">`;
            cursorInjected = true;
        }

        // Añadir el caracter o entidad completa
        for (let k = 0; k < entityLen; k++) {
            result += html[i + k];
        }
        i += entityLen;
        plainIndex++;

        // Inyectar cierre del cursor
        if (plainIndex === col + 1 && cursorInjected && !cursorClosed) {
            result += `</span>`;
            cursorClosed = true;
        }
    }

    // Cursor al final de la línea vacía o fuera de rango
    if (!cursorInjected) {
        result += `<span class="vim-cursor ${insertClass}"> </span>`;
    } else if (cursorInjected && !cursorClosed) {
        result += `</span>`;
    }

    return result;
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

    const ext = state.currentFile.split('.').pop().toLowerCase();
    const lang = ext === 'js' ? 'js' : (ext === 'lua' ? 'lua' : (ext === 'md' ? 'md' : ''));

    state.lines.forEach((line, ri) => {
        const isCurrent = ri === r;
        numHtml += `<span class="${isCurrent ? 'current' : ''}">${ri + 1}</span>`;

        const highlighted = highlight(line, lang);

        if (isCurrent && !isVisual) {
            const lineWithCursor = injectCursor(highlighted, c);
            contentHtml += `<span class="editor-line current-line">${lineWithCursor}</span>`;
        } else if (isVisual) {
            let lineHtml = `<span class="editor-line${isCurrent ? ' current-line' : ''}">`;
            if (mode === 'V-LINE' && ri >= vStart.row && ri <= vEnd.row) {
                lineHtml += `<span class="visual-selection">${escapeHtml(line) || ' '}</span>`;
            } else if (mode === 'VISUAL' && ri >= vStart.row && ri <= vEnd.row) {
                const cs = ri === vStart.row ? vStart.col : 0;
                const ce = ri === vEnd.row ? vEnd.col + 1 : line.length;
                const before = escapeHtml(line.slice(0, cs));
                const selection = escapeHtml(line.slice(cs, ce));
                const after = escapeHtml(line.slice(ce));
                lineHtml += `${before}<span class="visual-selection">${selection || ' '}</span>${after}`;
            } else {
                lineHtml += highlighted;
            }
            lineHtml += '</span>';
            contentHtml += lineHtml;
        } else {
            contentHtml += `<span class="editor-line">${highlighted}</span>`;
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
