import { state, getVisualRange } from '../state.js';
import { doAction, doVisualDelete, doVisualYank } from '../editor/actions.js';
import { render, updateUI } from '../editor/render.js';
import { enterMode } from '../state.js';

export function handleVisualMode(char) {
    if (char === 'Escape' || char === 'Esc') {
        enterMode('NORMAL');
        render();
        updateUI();
        return;
    }
    const moveActions = {
        'h': 'move-left', 'j': 'move-down', 'k': 'move-up', 'l': 'move-right',
        'w': 'move-word-fwd', 'b': 'move-word-back', 'e': 'move-word-end',
        '0': 'move-line-start', '$': 'move-line-end', 'G': 'move-eof'
    };
    if (moveActions[char]) {
        doAction(moveActions[char]);
        render();
        updateUI();
        return;
    }
    if (char === 'd' || char === 'x') {
        doVisualDelete();
        enterMode('NORMAL');
        render();
        updateUI();
        return;
    }
    if (char === 'y') {
        doVisualYank();
        render();
        updateUI();
        return;
    }
}
