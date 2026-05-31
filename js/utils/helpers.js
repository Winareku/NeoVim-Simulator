// Funciones misceláneas que no pertenecen a un módulo específico
export function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
