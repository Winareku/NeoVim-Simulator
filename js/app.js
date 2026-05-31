import { state, enterMode, doSearch } from './state.js';
import { FILES, switchFile, resetSimulator } from './files.js';
import { render, updateUI, setInfo, showMsg, updateCmdDisplay } from './editor/render.js';
import { processCommand } from './commands/modeDispatcher.js';
import { renderKeyboard, updateKeyboardLabels} from './keyboard/virtualKeyboard.js';
import { initPhysicalKeyboard } from './keyboard/physicalKeyboard.js';
import { processExCommand, exResult } from './commands/exCommands.js';

// Inicializar estado con archivo por defecto
state.lines = [...FILES['main.js'].lines];
state.currentFile = 'main.js';
document.getElementById('file-info').textContent = FILES['main.js'].lang;

// Renderizar por primera vez
render();
updateUI();
enterMode('NORMAL');

// Construir teclado virtual
renderKeyboard();

// Inicializar teclado físico
initPhysicalKeyboard();

// Event listeners para tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const fname = tab.dataset.file;
        if (fname && FILES[fname]) {
            switchFile(fname);
        }
    });
});

// Event listener para el input de comandos EX (manejo central)
const exInput = document.getElementById('ex-input');
exInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const prefix = document.getElementById('ex-colon').textContent;
        const cmd = e.target.value;
        if (prefix === ':') {
            processExCommand(cmd);
        } else if (prefix === '/' || prefix === '?') {
            state.searchPattern = cmd;
            doSearch(prefix === '/');
            exResult(`Buscando: "${state.searchPattern}"`, 'blue');
        }
        e.target.value = '';
        e.target.blur();
        enterMode('NORMAL');
    }
    if (e.key === 'Escape') {
        e.target.value = '';
        e.target.blur();
        enterMode('NORMAL');
    }
    e.stopPropagation();
});

// Exponer algunas funciones globalmente para legacy (no necesario pero seguro)
window.switchFile = switchFile;

// Event listener para restaurar cambios originales
document.getElementById('btn-reset').addEventListener('click', () => {
    resetSimulator();
    showMsg('✓ Simulador restaurado al estado inicial');
});
