import { state } from '../state.js';
import { handleNormalMode } from './normalMode.js';
import { handleInsertMode } from './insertMode.js';
import { handleVisualMode } from './visualMode.js';
import { render, updateUI, showMsg, updateCmdDisplay, setInfo } from '../editor/render.js';

export function processCommand(char, fromVirtual = false, event = null) {
    const mode = state.mode;

    // Detectar comandos Ex directamente en modo NORMAL
    if (mode === 'NORMAL') {
        if (char === ':' || char === '/' || char === '?') {
            if (event) event.preventDefault();
            import('./exCommands.js').then(ex => {
                ex.enterExMode(char);
            });
            return;
        }
    }

    if (mode === 'INSERT' || mode === 'REPLACE') {
        handleInsertMode(char);
        return;
    }

    if (mode === 'VISUAL' || mode === 'V-LINE' || mode === 'V-BLOCK') {
        handleVisualMode(char);
        return;
    }

    if (mode !== 'NORMAL') return;

    handleNormalMode(char);
}

// Función auxiliar para actualizar UI
export function updateUIAfterCommand() {
    render();
    updateUI();
}
