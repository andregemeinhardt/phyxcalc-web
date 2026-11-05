/**
 * Localization (i18n) module for PhyxCalc Web.
 * Carries over translations from desktop Qt l10n files (phyxcalc_de.ts)
 * and provides complete English and German UI strings.
 */

export type Language = 'en' | 'de';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Menu
    file: 'File',
    edit: 'Edit',
    view: 'View',
    tools: 'Tools',
    help: 'Help',
    newTab: 'New Tab',
    open: 'Open...',
    save: 'Save Worksheet',
    export: 'Export...',
    print: 'Print...',
    closeTab: 'Close Tab',
    clearWorksheet: 'Clear Worksheet',
    variablesDock: 'Variables Dock',
    constantsDock: 'Constants Dock',
    unitsDock: 'Units Dock',
    symbolsDock: 'Symbols Dock',
    plotWindow: 'Plot Window',
    recalculate: 'Recalculate',
    preferences: 'Preferences...',
    reloadApp: 'Reload Application',
    documentation: 'Documentation & Help',
    about: 'About PhyxCalc',

    // Toolbar
    calculate: 'Calculate',
    plot: 'Plot',
    variables: 'Variables',
    constants: 'Constants',
    units: 'Units',
    symbols: 'Symbols',

    // Docks
    search: 'Search...',
    name: 'Name',
    value: 'Value',
    unit: 'Unit',
    actions: 'Actions',
    noVariables: 'No variables defined yet.',
    greekAndMath: 'Greek & Math Symbols',

    // Plot Dialog
    plotViewer: 'Plot & Dataset Viewer',
    xScale: 'X Scale',
    yScale: 'Y Scale',
    markers: 'Markers',
    smooth: 'Smooth',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Zoom',
    chartView: 'Chart',
    tableView: 'Data Table',
    exportCSV: 'Export CSV',
    printChart: 'Print',

    // Settings Dialog
    precision: 'Decimal Precision',
    numberFormat: 'Number Format',
    imaginaryUnit: 'Imaginary Unit',
    fractions: 'Fraction Output',
    prefixMode: 'SI Prefix Mode',
    autoSuperscripts: 'Automatic Superscripts (^2 → ²)',
    cancel: 'Cancel',
    saveSettings: 'Save Preferences',

    // Export Dialog
    exportWorksheet: 'Export Worksheet',
    plainText: 'Plain Text',
    htmlTable: 'HTML Table',
    latex: 'LaTeX Equations',
    copyToClipboard: 'Copy to Clipboard',
    downloadFile: 'Download File',
    copied: 'Copied!',
  },
  de: {
    // Menu
    file: 'Datei',
    edit: 'Bearbeiten',
    view: 'Ansicht',
    tools: 'Werkzeuge',
    help: 'Hilfe',
    newTab: 'Neuer Reiter',
    open: 'Öffnen...',
    save: 'Arbeitsblatt speichern',
    export: 'Exportieren...',
    print: 'Drucken...',
    closeTab: 'Reiter schließen',
    clearWorksheet: 'Arbeitsblatt leeren',
    variablesDock: 'Variablen-Fenster',
    constantsDock: 'Konstanten-Fenster',
    unitsDock: 'Einheiten-Fenster',
    symbolsDock: 'Symbole-Fenster',
    plotWindow: 'Diagrammfenster',
    recalculate: 'Neu berechnen',
    preferences: 'Einstellungen...',
    reloadApp: 'App neu laden',
    documentation: 'Dokumentation & Hilfe',
    about: 'Über PhyxCalc',

    // Toolbar
    calculate: 'Berechnen',
    plot: 'Diagramm',
    variables: 'Variablen',
    constants: 'Konstanten',
    units: 'Einheiten',
    symbols: 'Symbole',

    // Docks
    search: 'Suchen...',
    name: 'Name',
    value: 'Wert',
    unit: 'Einheit',
    actions: 'Aktionen',
    noVariables: 'Noch keine Variablen definiert.',
    greekAndMath: 'Griechische & Mathe-Symbole',

    // Plot Dialog
    plotViewer: 'Diagramm- & Datensatzanzeige',
    xScale: 'X-Skala',
    yScale: 'Y-Skala',
    markers: 'Punkte',
    smooth: 'Glätten',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    resetZoom: 'Zurücksetzen',
    chartView: 'Diagramm',
    tableView: 'Datentabelle',
    exportCSV: 'CSV exportieren',
    printChart: 'Drucken',

    // Settings Dialog
    precision: 'Dezimalstellen',
    numberFormat: 'Zahlenformat',
    imaginaryUnit: 'Imaginäre Einheit',
    fractions: 'Bruchdarstellung',
    prefixMode: 'SI-Präfix-Modus',
    autoSuperscripts: 'Automatische Hochzahlen (^2 → ²)',
    cancel: 'Abbrechen',
    saveSettings: 'Einstellungen speichern',

    // Export Dialog
    exportWorksheet: 'Arbeitsblatt exportieren',
    plainText: 'Reiner Text',
    htmlTable: 'HTML-Tabelle',
    latex: 'LaTeX-Formeln',
    copyToClipboard: 'In die Zwischenablage kopieren',
    downloadFile: 'Datei herunterladen',
    copied: 'Kopiert!',
  },
};

export function getTranslation(lang: Language, key: string): string {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
}
