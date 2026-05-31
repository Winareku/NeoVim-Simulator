import { state } from '../state.js';
import { doAction } from '../editor/actions.js';
import { setInfo, showMsg, updateCmdDisplay, render, updateUI } from '../editor/render.js';

// Diccionario de comandos Vim
export const vimDict = {
    "h": { title: "Mover ← Izquierda", action: 'move-left' },
    "j": { title: "Mover ↓ Abajo", action: 'move-down' },
    "k": { title: "Mover ↑ Arriba", action: 'move-up' },
    "l": { title: "Mover → Derecha", action: 'move-right' },
    "w": { title: "Siguiente palabra →", action: 'move-word-fwd' },
    "b": { title: "← Palabra anterior", action: 'move-word-back' },
    "e": { title: "Final de palabra", action: 'move-word-end' },
    "0": { title: "Inicio de línea", action: 'move-line-start' },
    "^": { title: "Primer char no-espacio", action: 'move-line-first-nonblank' },
    "$": { title: "Fin de línea", action: 'move-line-end' },
    "G": { title: "Ir al Final del archivo", action: 'move-eof' },
    "gg":{ title: "Ir al Inicio del archivo", action: 'move-sof' },
    "{": { title: "Párrafo anterior", action: 'move-para-up' },
    "}": { title: "Párrafo siguiente", action: 'move-para-down' },
    "x": { title: "Borrar carácter (Del)", action: 'delete-char' },
    "D": { title: "Borrar hasta fin de línea", action: 'delete-eol' },
    "C": { title: "Cambiar hasta fin de línea", action: 'change-eol' },
    "J": { title: "Unir líneas", action: 'join-lines' },
    "r": { pending: true, title: "Reemplazar carácter (r)" },
    "d": { pending: true, title: "Operador: Delete" },
    "c": { pending: true, title: "Operador: Change" },
    "y": { pending: true, title: "Operador: Yank" },
    "g": { pending: true, title: "Prefijo: g..." },
    "dw":{ title: "Borrar palabra →", action: 'delete-word' },
    "db":{ title: "Borrar ← palabra", action: 'delete-word-back' },
    "dd":{ title: "Borrar línea completa", action: 'delete-line' },
    "d$":{ title: "Borrar hasta fin línea", action: 'delete-eol' },
    "cw":{ title: "Cambiar palabra →", action: 'change-word' },
    "cc":{ title: "Cambiar línea completa", action: 'change-line' },
    "yw":{ title: "Copiar palabra", action: 'yank-word' },
    "yy":{ title: "Copiar línea", action: 'yank-line' },
    "i": { title: "→ Modo INSERT (antes)", action: 'enter-insert' },
    "I": { title: "→ INSERT al inicio", action: 'enter-insert-bol' },
    "a": { title: "→ INSERT Append (después)", action: 'enter-insert-after' },
    "A": { title: "→ INSERT Append al final", action: 'enter-insert-eol' },
    "o": { title: "→ Abrir línea abajo + INSERT", action: 'open-line-below' },
    "O": { title: "→ Abrir línea arriba + INSERT", action: 'open-line-above' },
    "p": { title: "Pegar (paste) después", action: 'paste-after' },
    "P": { title: "Pegar antes", action: 'paste-before' },
    "u": { title: "Deshacer (Undo)", action: 'undo' },
    "Ctrl+r":{ title: "Rehacer (Redo)", action: 'redo' },
    "v": { title: "→ Modo VISUAL (char)", action: 'enter-visual' },
    "V": { title: "→ Modo VISUAL LINE", action: 'enter-visual-line' },
    "Ctrl+v":{ title: "→ Modo VISUAL BLOCK", action: 'enter-visual-block' },
    "n": { title: "Siguiente coincidencia", action: 'search-next' },
    "N": { title: "Coincidencia anterior", action: 'search-prev' },
    "Esc":{ title: "→ Modo NORMAL", action: 'escape' }
};

export function handleNormalMode(char) {
    if (char === 'Escape' || char === 'Esc') {
        state.pendingOp = '';
        updateCmdDisplay('');
        render();
        updateUI();
        return;
    }
    if (['Shift', 'Control', 'Alt', 'CapsLock', 'Tab', 'Meta'].includes(char)) return;

    const full = state.pendingOp + char;
    updateCmdDisplay(full);

    if (state.pendingOp === 'r') {
        if (char.length === 1) {
            import('../editor/actions.js').then(actions => {
                actions.doAction('replace-char', char);
            });
        }
        state.pendingOp = '';
        setTimeout(() => updateCmdDisplay(''), 1000);
        render();
        updateUI();
        return;
    }

    const entry = vimDict[full];
    if (entry) {
        if (entry.pending) {
            state.pendingOp = full;
            setInfo(entry.title, entry.detail || '', full, 'pending');
        } else {
            setInfo(entry.title, entry.detail || '', full, 'success');
            if (entry.action) {
                import('../editor/actions.js').then(actions => {
                    actions.doAction(entry.action);
                });
            }
            state.pendingOp = '';
            setTimeout(() => updateCmdDisplay(''), 1200);
        }
    } else {
        if (full.length > 3 || state.pendingOp !== '') {
            state.pendingOp = '';
            setTimeout(() => updateCmdDisplay(''), 1500);
        }
    }
    render();
    updateUI();
}
