import { state } from '../state.js';

export function wordBoundaryForward() {
    let { cursorRow: r, cursorCol: c } = state;
    const line = state.lines[r];
    let i = c;

    const isWordChar = (ch) => /\w/.test(ch);
    const isPunctChar = (ch) => /^[^\w\s]$/.test(ch);

    if (isWordChar(line[i])) {
        while (i < line.length && isWordChar(line[i])) i++;
    } else if (isPunctChar(line[i])) {
        while (i < line.length && isPunctChar(line[i])) i++;
    }

    while (i < line.length && /\s/.test(line[i])) i++;

    if (i >= line.length && r < state.lines.length - 1) {
        let nextR = r + 1;
        let m = state.lines[nextR].match(/\S/);
        return { row: nextR, col: m ? m.index : 0 };
    }
    return { row: r, col: Math.min(i, Math.max(0, line.length - 1)) };
}

export function wordBoundaryBack() {
    let { cursorRow: r, cursorCol: c } = state;
    let i = c - 1;
    if (i < 0 && r > 0) {
        r--;
        i = state.lines[r].length - 1;
    }
    if (i < 0) return { row: 0, col: 0 };

    const line = state.lines[r];
    while (i >= 0 && /\s/.test(line[i])) i--;
    if (i < 0) return { row: r, col: 0 };

    const isWordChar = (ch) => /\w/.test(ch);
    const isPunctChar = (ch) => /^[^\w\s]$/.test(ch);

    if (isWordChar(line[i])) {
        while (i > 0 && isWordChar(line[i - 1])) i--;
    } else if (isPunctChar(line[i])) {
        while (i > 0 && isPunctChar(line[i - 1])) i--;
    }

    return { row: r, col: Math.max(0, i) };
}

export function wordEnd() {
    let { cursorRow: r, cursorCol: c } = state;
    let line = state.lines[r];
    let i = c + 1;
    if (i >= line.length && r < state.lines.length - 1) {
        r++;
        i = 0;
        line = state.lines[r];
    }

    while (i < line.length && /\s/.test(line[i])) i++;
    if (i >= line.length) return { row: r, col: line.length - 1 || 0 };

    const isWordChar = (ch) => /\w/.test(ch);
    const isPunctChar = (ch) => /^[^\w\s]$/.test(ch);

    if (isWordChar(line[i])) {
        while (i < line.length - 1 && isWordChar(line[i + 1])) i++;
    } else if (isPunctChar(line[i])) {
        while (i < line.length - 1 && isPunctChar(line[i + 1])) i++;
    }

    return { row: r, col: Math.min(i, Math.max(0, line.length - 1)) };
}
