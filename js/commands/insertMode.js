import { state, saveHistory, currentLine, clampCol } from '../state.js';
import { render, updateUI } from '../editor/render.js';
import { enterMode } from '../state.js';

export function handleInsertMode(char) {
    if (char === 'Escape' || char === 'Esc') {
        enterMode('NORMAL');
        state.cursorCol = clampCol(state.cursorRow, state.cursorCol - 1);
        return;
    }
    if (char === 'Enter') {
        saveHistory();
        const line = currentLine();
        const before = line.slice(0, state.cursorCol);
        const after = line.slice(state.cursorCol);
        const indent = before.match(/^\s*/)[0];
        state.lines[state.cursorRow] = before;
        state.lines.splice(state.cursorRow + 1, 0, indent + after.trimStart());
        state.cursorRow++;
        state.cursorCol = indent.length;
        render();
        updateUI();
        return;
    }
    if (char === 'Backspace') {
        const r = state.cursorRow, c = state.cursorCol;
        if (c > 0) {
            saveHistory();
            state.lines[r] = state.lines[r].slice(0, c - 1) + state.lines[r].slice(c);
            state.cursorCol--;
        } else if (r > 0) {
            saveHistory();
            const prev = state.lines[r - 1];
            state.lines[r - 1] = prev + state.lines[r];
            state.lines.splice(r, 1);
            state.cursorRow--;
            state.cursorCol = prev.length;
        }
        render();
        updateUI();
        return;
    }
    if (char.length === 1 || char === 'Tab') {
        const ins = char === 'Tab' ? '  ' : char;
        saveHistory();
        const r = state.cursorRow, c = state.cursorCol;
        state.lines[r] = state.lines[r].slice(0, c) + ins + state.lines[r].slice(c);
        state.cursorCol += ins.length;
        render();
        updateUI();
        return;
    }
}
