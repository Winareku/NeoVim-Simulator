import { state } from './state.js';
import { render, updateUI, showMsg } from './editor/render.js';
import { enterMode } from './state.js';

// Contenido de los archivos simulados
export const FILES = {
    'main.js': {
        lang: 'JavaScript • UTF-8',
        lines: [
            "// Neovim Simulator — main.js",
            "// Practica aquí tus comandos de Neovim",
            "",
            "import { createApp } from 'vue'",
            "import App from './App.vue'",
            "",
            "const CONFIG = {",
            "  theme: 'gruvbox',",
            "  fontSize: 14,",
            "  tabSize: 2,",
            "  lineNumbers: true,",
            "  relativeLine: false,",
            "}",
            "",
            "function initEditor(config) {",
            "  const editor = new Editor(config)",
            "  editor.bindKeys()",
            "  editor.render()",
            "  return editor",
            "}",
            "",
            "// Inicializar cuando el DOM esté listo",
            "document.addEventListener('DOMContentLoaded', () => {",
            "  const app = initEditor(CONFIG)",
            "  app.loadFile('README.md')",
            "  console.log('Editor listo.')",
            "})",
        ]
    },
    'config.lua': {
        lang: 'Lua • UTF-8',
        lines: [
            "-- Neovim config (init.lua)",
            "",
            "vim.opt.number = true",
            "vim.opt.relativenumber = true",
            "vim.opt.tabstop = 2",
            "vim.opt.shiftwidth = 2",
            "vim.opt.expandtab = true",
            "vim.opt.smartindent = true",
            "vim.opt.wrap = false",
            "vim.opt.ignorecase = true",
            "vim.opt.smartcase = true",
            "vim.opt.hlsearch = false",
            "",
            "-- Leader key",
            "vim.g.mapleader = ' '",
            "",
            "-- Keymaps",
            "local map = vim.keymap.set",
            "map('n', '<leader>w', ':w<CR>')",
            "map('n', '<leader>q', ':q<CR>')",
            "map('n', '<C-h>', '<C-w>h')",
            "map('n', '<C-l>', '<C-w>l')",
        ]
    },
    'readme.md': {
        lang: 'Markdown • UTF-8',
        lines: [
            "# Neovim Simulator",
            "",
            "Bienvenido al simulador interactivo de Neovim.",
            "Usa este editor para practicar comandos reales.",
            "",
            "## Modos",
            "",
            "- **NORMAL**: navegación y comandos (modo base)",
            "- **INSERT**: escritura de texto",
            "- **VISUAL**: selección de texto",
            "- **COMMAND**: comandos ex con ':'",
            "",
            "## Primeros pasos",
            "",
            "1. Muévete con h, j, k, l",
            "2. Entra en Insert con 'i'",
            "3. Escribe algo y vuelve con Esc",
            "4. Borra una línea con 'dd'",
            "5. Deshace con 'u'",
        ]
    }
};

export function switchFile(fname) {
    if (!FILES[fname]) return;
    // Guardar cambios del archivo actual
    FILES[state.currentFile].lines = [...state.lines];
    state.currentFile = fname;
    state.lines = [...FILES[fname].lines];
    state.cursorRow = 0;
    state.cursorCol = 0;
    state.history = [];
    state.future = [];
    state.pendingOp = '';
    state.modified = false;
    enterMode('NORMAL');
    document.querySelectorAll('.tab').forEach(t => {
        const isActive = t.dataset.file === fname;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    document.getElementById('file-info').textContent = FILES[fname].lang;
    render();
    updateUI();
    showMsg(`"${fname}" cargado — ${state.lines.length} líneas`);
}

// Resguardo de los contenidos iniciales para restauración
const INITIAL_FILES = JSON.parse(JSON.stringify(FILES));

export function resetSimulator() {
    Object.keys(INITIAL_FILES).forEach(key => {
        FILES[key].lines = [...INITIAL_FILES[key].lines];
    });
    state.lines = [...FILES[state.currentFile].lines]; // Restablecer estado activo antes de cambiar de archivo para evitar auto-guardar cambios
    switchFile('main.js');
}
