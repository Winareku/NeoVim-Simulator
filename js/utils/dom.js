// Utilidades DOM (funciones que actualizan elementos específicos)
import { state } from '../state.js';

export function updateCmdDisplay(cmd) {
    document.getElementById('cmd-display').textContent = cmd;
}

export function setInfo(title, detail, cmd, type) {
    document.getElementById('desc-main').textContent = title;
    document.getElementById('desc-detail').textContent = detail;
    updateCmdDisplay(cmd || '');
}

let msgTimeout;
export function showMsg(msg) {
    const el = document.getElementById('cmd-msg');
    document.getElementById('cmd-prompt').style.display = 'none';
    el.textContent = msg;
    clearTimeout(msgTimeout);
    msgTimeout = setTimeout(() => {
        if (state.mode === 'NORMAL') el.textContent = '-- Presiona : para comandos ex, ? para buscar --';
    }, 3000);
}
