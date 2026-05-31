import { state } from '../state.js';
import { processCommand } from '../commands/modeDispatcher.js';
import { render, updateUI } from '../editor/render.js';
import { updateKeyboardLabels, updateKeyHints } from './virtualKeyboard.js';

export function initPhysicalKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (document.activeElement === document.getElementById('ex-input')) return;
        const prevent = ["Space", "Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
        if (prevent.includes(e.code) || (e.ctrlKey && ['f', 'b', 'd', 'u', 'r', 'v', 'z'].includes(e.key.toLowerCase()))) {
            e.preventDefault();
        }

        if (e.key === 'Shift')   { state.isShiftDown = true;  updateKeyboardLabels(); return; }
        if (e.key === 'Control') { state.isCtrlDown  = true;  updateKeyboardLabels(); return; }

        const keyEl = document.querySelector(`.key[data-code="${e.code}"]`);
        if (keyEl) keyEl.classList.add('active');

        let char = e.key;
        if (e.ctrlKey && e.key !== 'Control') char = `Ctrl+${e.key.toLowerCase()}`;
        if (e.code === 'Space') char = ' ';

        processCommand(char, false, e);
        render();
        updateUI();
        updateKeyHints();
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift')   { state.isShiftDown = false; updateKeyboardLabels(); }
        if (e.key === 'Control') { state.isCtrlDown  = false; updateKeyboardLabels(); }
        const keyEl = document.querySelector(`.key[data-code="${e.code}"]`);
        if (keyEl) keyEl.classList.remove('active');
    });
}
