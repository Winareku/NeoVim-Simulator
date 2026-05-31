import { state } from '../state.js';
import { saveHistory } from '../state.js';
import { render, updateUI, showMsg } from '../editor/render.js';
import { enterMode } from '../state.js';

export function enterExMode(prefix) {
    enterMode('COMMAND');
    const exInput = document.getElementById('ex-input');
    document.getElementById('ex-colon').textContent = prefix;
    exInput.value = '';
    exInput.focus();
    state.pendingOp = '';
    import('../editor/render.js').then(render => render.updateCmdDisplay(''));
    render.render();
    render.updateUI();
}

export function processExCommand(cmd) {
    cmd = cmd.trim();
    if (cmd === 'w' || cmd === 'write') {
        state.savedFiles[state.currentFile] = [...state.lines];
        state.modified = false;
        exResult('✓ Archivo guardado', 'green');
    } else if (cmd === 'q' || cmd === 'quit') {
        exResult('Simula salir de nvim.', 'gray');
    } else if (cmd === 'wq' || cmd === 'x') {
        state.modified = false;
        exResult('✓ Guardado. Salida simulada.', 'green');
    } else if (cmd.startsWith('s/') || cmd.startsWith('%s/')) {
        const parts = cmd.replace(/^%?s\//, '').split('/');
        const from = parts[0], to = parts[1] || '', flags = parts[2] || '';
        const allLines = cmd.startsWith('%') || flags.includes('g');
        saveHistory();
        let count = 0;
        const rows = allLines ? state.lines.map((_, i) => i) : [state.cursorRow];
        rows.forEach(ri => {
            const orig = state.lines[ri];
            const replaced = (flags.includes('g') || allLines) ? orig.split(from).join(to) : orig.replace(from, to);
            if (replaced !== orig) {
                state.lines[ri] = replaced;
                count++;
            }
        });
        render();
        updateUI();
        exResult(`✓ ${count} sustitución(es)`, 'green');
    } else {
        exResult(`Comando desconocido: "${cmd}"`, 'red');
    }
}

export function exResult(msg, color) {
    const el = document.getElementById('ex-result');
    const colors = {
        green: 'var(--green-b)',
        red: 'var(--red-bright)',
        blue: 'var(--blue-b)',
        gray: 'var(--fg4)',
        orange: 'var(--orange-b)'
    };
    el.textContent = msg;
    el.style.color = colors[color] || 'var(--fg4)';
    setTimeout(() => { el.textContent = ''; }, 4000);
}
