import { state, saveHistory, clampRow, clampCol, currentLine, getVisualRange } from '../state.js';
import { wordBoundaryForward, wordBoundaryBack, wordEnd } from './cursor.js';
import { enterMode, doSearch } from '../state.js';
import { showMsg, setInfo, updateCmdDisplay, render, updateUI } from './render.js';

export function doAction(action, extraChar) {
    const r = state.cursorRow;
    const c = state.cursorCol;
    const line = currentLine();

    switch (action) {
        case 'move-left': state.cursorCol = clampCol(r, c - 1); break;
        case 'move-right': state.cursorCol = clampCol(r, c + 1); break;
        case 'move-up': state.cursorRow = clampRow(r - 1); state.cursorCol = clampCol(state.cursorRow, c); break;
        case 'move-down': state.cursorRow = clampRow(r + 1); state.cursorCol = clampCol(state.cursorRow, c); break;
        case 'move-word-fwd': { const p = wordBoundaryForward(); state.cursorRow = p.row; state.cursorCol = p.col; break; }
        case 'move-word-back': { const p = wordBoundaryBack(); state.cursorRow = p.row; state.cursorCol = p.col; break; }
        case 'move-word-end': { const p = wordEnd(); state.cursorRow = p.row; state.cursorCol = p.col; break; }
        case 'move-line-start': state.cursorCol = 0; break;
        case 'move-line-end': state.cursorCol = Math.max(0, line.length - 1); break;
        case 'move-line-first-nonblank': { const m = line.match(/\S/); state.cursorCol = m ? m.index : 0; break; }
        case 'move-eof': state.cursorRow = state.lines.length - 1; state.cursorCol = clampCol(state.cursorRow, c); break;
        case 'move-sof': state.cursorRow = 0; state.cursorCol = clampCol(0, c); break;
        case 'move-para-up': { let i = r - 1; while (i > 0 && state.lines[i].trim() !== '') i--; state.cursorRow = i; state.cursorCol = 0; break; }
        case 'move-para-down': { let i = r + 1; while (i < state.lines.length - 1 && state.lines[i].trim() !== '') i++; state.cursorRow = i; state.cursorCol = 0; break; }
        case 'delete-char': {
            if (line.length === 0) break;
            saveHistory();
            state.clipboard = { text: line[c], type: 'char' };
            state.lines[r] = line.slice(0, c) + line.slice(c + 1);
            state.cursorCol = clampCol(r, c);
            break;
        }
        case 'delete-line': {
            saveHistory();
            state.clipboard = { text: state.lines[r], type: 'line' };
            if (state.lines.length === 1) {
                state.lines[0] = '';
            } else {
                state.lines.splice(r, 1);
            }
            state.cursorRow = clampRow(r);
            state.cursorCol = clampCol(state.cursorRow, c);
            break;
        }
        case 'delete-word': {
            saveHistory();
            const dest = wordBoundaryForward();
            if (dest.row === r) {
                state.clipboard = { text: line.slice(c, dest.col), type: 'char' };
                state.lines[r] = line.slice(0, c) + line.slice(dest.col);
            } else {
                state.clipboard = { text: line.slice(c), type: 'char' };
                state.lines[r] = line.slice(0, c);
            }
            state.cursorCol = clampCol(r, c);
            break;
        }
        case 'delete-word-back': {
            saveHistory();
            const dest = wordBoundaryBack();
            if (dest.row === r) {
                state.clipboard = { text: line.slice(dest.col, c), type: 'char' };
                state.lines[r] = line.slice(0, dest.col) + line.slice(c);
                state.cursorCol = dest.col;
            }
            break;
        }
        case 'delete-eol': {
            saveHistory();
            state.clipboard = { text: line.slice(c), type: 'char' };
            state.lines[r] = line.slice(0, c);
            state.cursorCol = Math.max(0, state.lines[r].length - 1);
            break;
        }
        case 'change-word': {
            saveHistory();
            const dest = wordBoundaryForward();
            if (dest.row === r) state.lines[r] = line.slice(0, c) + line.slice(dest.col);
            else state.lines[r] = line.slice(0, c);
            state.cursorCol = clampCol(r, c);
            enterMode('INSERT');
            break;
        }
        case 'change-line': {
            saveHistory();
            const indent = line.match(/^\s*/)[0];
            state.lines[r] = indent;
            state.cursorCol = indent.length;
            enterMode('INSERT');
            break;
        }
        case 'change-eol': {
            saveHistory();
            state.lines[r] = line.slice(0, c);
            state.cursorCol = clampCol(r, c);
            enterMode('INSERT');
            break;
        }
        case 'enter-insert': enterMode('INSERT'); break;
        case 'enter-insert-after': state.cursorCol = Math.min(c + 1, line.length); enterMode('INSERT'); break;
        case 'enter-insert-bol': state.cursorCol = 0; enterMode('INSERT'); break;
        case 'enter-insert-eol': state.cursorCol = line.length; enterMode('INSERT'); break;
        case 'open-line-below': {
            saveHistory();
            const indent = line.match(/^\s*/)[0];
            state.lines.splice(r + 1, 0, indent);
            state.cursorRow = r + 1;
            state.cursorCol = indent.length;
            enterMode('INSERT');
            break;
        }
        case 'open-line-above': {
            saveHistory();
            const indent = line.match(/^\s*/)[0];
            state.lines.splice(r, 0, indent);
            state.cursorCol = indent.length;
            enterMode('INSERT');
            break;
        }
        case 'yank-word': {
            const dest = wordBoundaryForward();
            state.clipboard = { text: dest.row === r ? line.slice(c, dest.col) : line.slice(c), type: 'char' };
            showMsg(`Yank: "${state.clipboard.text.slice(0,20)}"`);
            break;
        }
        case 'yank-line': {
            state.clipboard = { text: line, type: 'line' };
            showMsg(`Yank line: "${line.slice(0,20)}"`);
            break;
        }
        case 'paste-after': {
            if (!state.clipboard.text) break;
            saveHistory();
            if (state.clipboard.type === 'line') {
                const pasteLines = state.clipboard.text.split('\n');
                state.lines.splice(r + 1, 0, ...pasteLines);
                state.cursorRow = r + 1;
                state.cursorCol = 0;
            } else {
                const newLine = line.slice(0, c + 1) + state.clipboard.text + line.slice(c + 1);
                state.lines[r] = newLine;
                state.cursorCol = c + state.clipboard.text.length;
            }
            break;
        }
        case 'paste-before': {
            if (!state.clipboard.text) break;
            saveHistory();
            if (state.clipboard.type === 'line') {
                const pasteLines = state.clipboard.text.split('\n');
                state.lines.splice(r, 0, ...pasteLines);
                state.cursorCol = 0;
            } else {
                const newLine = line.slice(0, c) + state.clipboard.text + line.slice(c);
                state.lines[r] = newLine;
                state.cursorCol = c + state.clipboard.text.length - 1;
            }
            break;
        }
        case 'join-lines': {
            if (r >= state.lines.length - 1) break;
            saveHistory();
            state.lines[r] = state.lines[r].trimEnd() + ' ' + state.lines[r + 1].trimStart();
            state.lines.splice(r + 1, 1);
            break;
        }
        case 'replace-char': {
            if (extraChar && c < line.length) {
                saveHistory();
                state.lines[r] = line.slice(0, c) + extraChar + line.slice(c + 1);
            }
            break;
        }
        case 'undo': {
            if (state.history.length === 0) {
                showMsg('Ya en el estado más antiguo');
                break;
            }
            const snap = state.history.pop();
            state.future.push({ lines: [...state.lines], row: state.cursorRow, col: state.cursorCol, modified: state.modified });
            state.lines = [...snap.lines];
            state.cursorRow = snap.row;
            state.cursorCol = snap.col;
            state.modified = snap.modified;
            showMsg('Deshecho (undo)');
            break;
        }
        case 'redo': {
            if (state.future.length === 0) {
                showMsg('Ya en el estado más reciente');
                break;
            }
            const snap = state.future.pop();
            state.history.push({ lines: [...state.lines], row: state.cursorRow, col: state.cursorCol, modified: state.modified });
            state.lines = [...snap.lines];
            state.cursorRow = snap.row;
            state.cursorCol = snap.col;
            state.modified = snap.modified;
            showMsg('Rehecho (redo)');
            break;
        }
        case 'enter-visual': state.visualAnchor = { row: r, col: c }; enterMode('VISUAL'); break;
        case 'enter-visual-line': state.visualAnchor = { row: r, col: c }; enterMode('V-LINE'); break;
        case 'enter-visual-block': state.visualAnchor = { row: r, col: c }; enterMode('V-BLOCK'); break;
        case 'search-next': doSearch(true); break;
        case 'search-prev': doSearch(false); break;
        case 'escape': state.pendingOp = ''; enterMode('NORMAL'); break;
    }
}

export function doVisualDelete() {
    saveHistory();
    const mode = state.mode;
    if (mode === 'V-LINE') {
        const { start, end } = getVisualRange();
        const deleted = state.lines.splice(start.row, end.row - start.row + 1);
        state.clipboard = { text: deleted.join('\n'), type: 'line' };
        if (state.lines.length === 0) state.lines.push('');
        state.cursorRow = clampRow(start.row);
        state.cursorCol = 0;
    } else {
        const { start, end } = getVisualRange();
        if (start.row === end.row) {
            const line = state.lines[start.row];
            state.clipboard = { text: line.slice(start.col, end.col + 1), type: 'char' };
            state.lines[start.row] = line.slice(0, start.col) + line.slice(end.col + 1);
        } else {
            const firstLine = state.lines[start.row].slice(0, start.col);
            const lastLine = state.lines[end.row].slice(end.col + 1);
            state.lines.splice(start.row, end.row - start.row + 1, firstLine + lastLine);
        }
        state.cursorRow = start.row;
        state.cursorCol = start.col;
    }
}

export function doVisualYank() {
    const mode = state.mode;
    const { start, end } = getVisualRange();
    if (mode === 'V-LINE') {
        const lines = state.lines.slice(start.row, end.row + 1);
        state.clipboard = { text: lines.join('\n'), type: 'line' };
        showMsg(`Yanked ${lines.length} lines`);
    } else {
        if (start.row === end.row) {
            const text = state.lines[start.row].slice(start.col, end.col + 1);
            state.clipboard = { text, type: 'char' };
            showMsg(`Yanked "${text}"`);
        } else {
            // Visual multiline character-wise yank - simplificado
            let yanked = [];
            for (let i = start.row; i <= end.row; i++) {
                const line = state.lines[i];
                if (i === start.row) yanked.push(line.slice(start.col));
                else if (i === end.row) yanked.push(line.slice(0, end.col + 1));
                else yanked.push(line);
            }
            state.clipboard = { text: yanked.join('\n'), type: 'char' };
            showMsg(`Yanked multiline`);
        }
    }
    enterMode('NORMAL');
}
