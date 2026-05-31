import { state, enterMode, doSearch } from '../state.js';
import { processCommand } from '../commands/modeDispatcher.js';
import { render, updateUI, showMsg, setInfo } from '../editor/render.js';
import { processExCommand, exResult } from '../commands/exCommands.js';

// Layout del teclado virtual
export const layout = [
    [
        { n:'Esc', s:'Esc', c:'Escape' },
        { n:'1', s:'!', c:'Digit1' }, { n:'2', s:'@', c:'Digit2' },
        { n:'3', s:'#', c:'Digit3' }, { n:'4', s:'$', c:'Digit4' },
        { n:'5', s:'%', c:'Digit5' }, { n:'6', s:'^', c:'Digit6' },
        { n:'7', s:'&', c:'Digit7' }, { n:'8', s:'*', c:'Digit8' },
        { n:'9', s:'(', c:'Digit9' }, { n:'0', s:')', c:'Digit0' },
        { n:'-', s:'_', c:'Minus' }, { n:'=', s:'+', c:'Equal' },
        { n:'⌫', s:'⌫', c:'Backspace' }
    ],
    [
        { n:'Tab', s:'Tab', c:'Tab' },
        { n:'q', s:'Q', c:'KeyQ' }, { n:'w', s:'W', c:'KeyW' },
        { n:'e', s:'E', c:'KeyE' }, { n:'r', s:'R', c:'KeyR' },
        { n:'t', s:'T', c:'KeyT' }, { n:'y', s:'Y', c:'KeyY' },
        { n:'u', s:'U', c:'KeyU' }, { n:'i', s:'I', c:'KeyI' },
        { n:'o', s:'O', c:'KeyO' }, { n:'p', s:'P', c:'KeyP' },
        { n:'[', s:'{', c:'BracketLeft' }, { n:']', s:'}', c:'BracketRight' },
        { n:'\\', s:'|', c:'Backslash' }
    ],
    [
        { n:'Caps', s:'Caps', c:'CapsLock' },
        { n:'a', s:'A', c:'KeyA' }, { n:'s', s:'S', c:'KeyS' },
        { n:'d', s:'D', c:'KeyD' }, { n:'f', s:'F', c:'KeyF' },
        { n:'g', s:'G', c:'KeyG' }, { n:'h', s:'H', c:'KeyH' },
        { n:'j', s:'J', c:'KeyJ' }, { n:'k', s:'K', c:'KeyK' },
        { n:'l', s:'L', c:'KeyL' }, { n:';', s:':', c:'Semicolon' },
        { n:"'", s:'"', c:'Quote' }, { n:'Enter', s:'Enter', c:'Enter' }
    ],
    [
        { n:'Shift', s:'Shift', c:'ShiftLeft' },
        { n:'z', s:'Z', c:'KeyZ' }, { n:'x', s:'X', c:'KeyX' },
        { n:'c', s:'C', c:'KeyC' }, { n:'v', s:'V', c:'KeyV' },
        { n:'b', s:'B', c:'KeyB' }, { n:'n', s:'N', c:'KeyN' },
        { n:'m', s:'M', c:'KeyM' }, { n:',', s:'<', c:'Comma' },
        { n:'.', s:'>', c:'Period' }, { n:'/', s:'?', c:'Slash' },
        { n:'Shift', s:'Shift', c:'ShiftRight' }
    ],
    [
        { n:'Ctrl', s:'Ctrl', c:'ControlLeft' },
        { n:'Alt', s:'Alt', c:'AltLeft' },
        { n:'Space', s:'Space', c:'Space' },
        { n:'Alt', s:'Alt', c:'AltRight' },
        { n:'Ctrl', s:'Ctrl', c:'ControlRight' }
    ]
];

export const KEY_HINTS = {
    'h': '← move', 'j': '↓ move', 'k': '↑ move', 'l': '→ move',
    'w': 'next word', 'b': 'prev word', 'e': 'end word',
    'i': 'INSERT', 'a': 'append', 'o': 'open ↓', 'A': 'end+ins', 'I': 'start+ins',
    'd': 'delete', 'c': 'change', 'y': 'yank', 'p': 'paste',
    'u': 'undo', 'r': 'replace', 'v': 'visual', 'x': 'del char',
    'g': 'go to', 'G': 'EOF', 'D': 'del EOL', 'Y': 'yank line',
    '0': 'line start', '$': 'line end', 'Esc': 'NORMAL',
    'dd': 'del line', 'yy': 'yank line',
};

export function renderKeyboard() {
    const kb = document.getElementById('keyboard');
    kb.innerHTML = '';
    layout.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'row';
        row.forEach(key => {
            const keyEl = document.createElement('div');
            keyEl.className = 'key';
            keyEl.dataset.code = key.c;
            keyEl.dataset.norm = key.n;
            keyEl.dataset.shift = key.s;
            
            // Atributos de accesibilidad
            keyEl.setAttribute('role', 'button');
            keyEl.setAttribute('tabindex', '-1');
            keyEl.setAttribute('aria-label', `Tecla ${key.n}`);
            
            const mainSpan = document.createElement('span');
            mainSpan.className = 'key-main';
            mainSpan.textContent = key.n;
            const hintSpan = document.createElement('span');
            hintSpan.className = 'key-hint';
            hintSpan.textContent = KEY_HINTS[key.n] || '';
            keyEl.appendChild(mainSpan);
            keyEl.appendChild(hintSpan);
            if (KEY_HINTS[key.n]) keyEl.classList.add('has-cmd');
            keyEl.addEventListener('mousedown', (e) => {
                e.preventDefault();
                simulateKeyPress(key);
            });
            rowEl.appendChild(keyEl);
        });
        rowEl.setAttribute('role', 'row');
        kb.appendChild(rowEl);
    });
    updateKeyHints();
}

export function simulateKeyPress(keyInfo) {
    if (keyInfo.c.includes('Shift')) {
        state.isVirtualShift = !state.isVirtualShift;
        updateKeyboardLabels();
        return;
    }
    if (keyInfo.c.includes('Control')) {
        state.isCtrlDown = !state.isCtrlDown;
        return;
    }

    const keyEl = document.querySelector(`.key[data-code="${keyInfo.c}"]`);
    if (keyEl) {
        keyEl.classList.add('active');
        setTimeout(() => keyEl.classList.remove('active'), 120);
    }

    let char = (state.isShiftDown || state.isVirtualShift) ? keyInfo.s : keyInfo.n;
    if (state.isCtrlDown) char = `Ctrl+${char.toLowerCase()}`;

    if (char === '⌫') char = 'Backspace';
    if (char === 'Caps') char = 'CapsLock';
    if (char === 'Space') char = ' ';

    // Si estamos en modo COMMAND, redirigir al input Ex
    if (state.mode === 'COMMAND') {
        const exInput = document.getElementById('ex-input');
        if (char === 'Backspace') {
            exInput.value = exInput.value.slice(0, -1);
        } else if (char === 'Enter') {
            const prefix = document.getElementById('ex-colon').textContent;
            const val = exInput.value;
            if (prefix === ':') {
                processExCommand(val);
            } else if (prefix === '/' || prefix === '?') {
                state.searchPattern = val;
                doSearch(prefix === '/');
                exResult(`Buscando: "${state.searchPattern}"`, 'blue');
            }
            exInput.value = '';
            exInput.blur();
            enterMode('NORMAL');
        } else if (char === 'Escape' || char === 'Esc') {
            exInput.value = '';
            exInput.blur();
            enterMode('NORMAL');
        } else if (char.length === 1) {
            exInput.value += char;
        }
        if (state.isVirtualShift) { state.isVirtualShift = false; updateKeyboardLabels(); }
        if (state.isCtrlDown) state.isCtrlDown = false;
        return;
    }

    processCommand(char, true);
    if (state.isVirtualShift) { state.isVirtualShift = false; updateKeyboardLabels(); }
    if (state.isCtrlDown) state.isCtrlDown = false;
}

export function updateKeyboardLabels() {
    document.querySelectorAll('.key').forEach(k => {
        const mainSpan = k.querySelector('.key-main');
        if (mainSpan) {
            mainSpan.textContent = (state.isShiftDown || state.isVirtualShift) ? k.dataset.shift : k.dataset.norm;
        }
        if (k.dataset.code?.includes('Shift')) {
            if (state.isVirtualShift) k.classList.add('shift-active');
            else k.classList.remove('shift-active');
        }
    });
}

export function updateKeyHints() {
    document.querySelectorAll('.key').forEach(k => {
        const norm = k.dataset.norm;
        const hintEl = k.querySelector('.key-hint');
        if (!hintEl) return;
        hintEl.textContent = state.mode === 'NORMAL' ? (KEY_HINTS[norm] || KEY_HINTS[norm?.toUpperCase()] || '') : '';
    });
}
