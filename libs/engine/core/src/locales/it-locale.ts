import { KritzelLocale } from '../interfaces/localization.interface';

/**
 * Built-in Italian locale.
 */
export const IT_LOCALE: KritzelLocale = {
  code: 'it',
  label: 'Italiano',
  terms: {
    // Context menu
    'menu.copy': 'Copia',
    'menu.cut': 'Taglia',
    'menu.paste': 'Incolla',
    'menu.selectAll': 'Seleziona tutto',
    'menu.order': 'Ordine',
    'menu.bringToFront': 'Porta in primo piano',
    'menu.sendToBack': 'Invia in secondo piano',
    'menu.moveUp': 'Sposta in alto',
    'menu.moveDown': 'Sposta in basso',
    'menu.align': 'Allinea',
    'menu.alignLeft': 'Allinea a sinistra',
    'menu.alignCenterHorizontal': 'Allinea al centro orizzontalmente',
    'menu.alignRight': 'Allinea a destra',
    'menu.alignTop': 'Allinea in alto',
    'menu.alignCenterVertical': 'Allinea al centro verticalmente',
    'menu.alignBottom': 'Allinea in basso',
    'menu.group': 'Raggruppa',
    'menu.ungroup': 'Separa',
    'menu.export': 'Esporta',
    'menu.exportAsSvg': 'Esporta come SVG',
    'menu.exportAsPng': 'Esporta come PNG',
    'menu.delete': 'Elimina',

    // More menu
    'menu.share': 'Condividi',
    'menu.import': 'Importa',
    'menu.settings': 'Impostazioni',
    'menu.logout': 'Esci',

    // Settings dialog
    'settings.dialogTitle': 'Impostazioni',
    'settings.categories.general': 'Generali',
    'settings.categories.viewport': 'Area di visualizzazione',
    'settings.categories.shortcuts': 'Scorciatoie da tastiera',
    'settings.categories.developer': 'Opzioni sviluppatore',
    'settings.categories.about': 'Informazioni',
    'settings.general.title': 'Impostazioni generali',
    'settings.general.theme.label': 'Tema',
    'settings.general.theme.description': "Seleziona un tema di colori registrato per l'interfaccia dell'editor.",
    'settings.general.language.label': 'Lingua',
    'settings.general.language.description': "Seleziona la lingua di visualizzazione dell'interfaccia dell'editor.",
    'settings.general.lockDrawingScale.label': 'Blocca la scala del disegno',
    'settings.general.lockDrawingScale.description': "Se attivata, gli oggetti disegnati mantengono una dimensione visiva fissa indipendentemente dal livello di zoom corrente.",
    'settings.viewport.title': "Impostazioni dell'area di visualizzazione",
    'settings.viewport.minZoom.label': 'Livello minimo di zoom',
    'settings.viewport.minZoom.description': "Imposta il livello minimo di zoom. Valori più bassi consentono di ridurre ulteriormente lo zoom e visualizzare una porzione maggiore della tela.",
    'settings.viewport.maxZoom.label': 'Livello massimo di zoom',
    'settings.viewport.maxZoom.description': 'Imposta il livello massimo di zoom. Valori più alti consentono di ingrandire per lavorare sui dettagli.',
    'settings.viewport.boundaryLeft.label': "Limite sinistro dell'area di visualizzazione",
    'settings.viewport.boundaryLeft.description': "Limite sinistro in coordinate del mondo. Imposta fin dove può spostarsi l'area di visualizzazione verso sinistra.",
    'settings.viewport.boundaryRight.label': "Limite destro dell'area di visualizzazione",
    'settings.viewport.boundaryRight.description': "Limite destro in coordinate del mondo. Imposta fin dove può spostarsi l'area di visualizzazione verso destra.",
    'settings.viewport.boundaryTop.label': "Limite superiore dell'area di visualizzazione",
    'settings.viewport.boundaryTop.description': "Limite superiore in coordinate del mondo. Imposta fin dove può spostarsi l'area di visualizzazione verso l'alto.",
    'settings.viewport.boundaryBottom.label': "Limite inferiore dell'area di visualizzazione",
    'settings.viewport.boundaryBottom.description': "Limite inferiore in coordinate del mondo. Imposta fin dove può spostarsi l'area di visualizzazione verso il basso.",
    'settings.viewport.boundaryPlaceholder': 'Infinito',
    'settings.shortcuts.title': 'Scorciatoie da tastiera',
    'settings.developer.title': 'Opzioni sviluppatore',
    'settings.developer.showViewportInfo.label': "Mostra informazioni sull'area di visualizzazione",
    'settings.developer.showViewportInfo.description': "Visualizza informazioni di debug sull'area di visualizzazione, come posizione, livello di zoom e limiti.",
    'settings.developer.showObjectInfo.label': 'Mostra informazioni sugli oggetti',
    'settings.developer.showObjectInfo.description': 'Visualizza informazioni di debug sugli oggetti presenti sulla tela.',
    'settings.developer.showSyncProviderInfo.label': 'Mostra informazioni sul provider di sincronizzazione',
    'settings.developer.showSyncProviderInfo.description': 'Visualizza informazioni di debug sullo stato della connessione del provider di sincronizzazione.',
    'settings.developer.showMigrationInfo.label': 'Mostra informazioni sulla migrazione',
    'settings.developer.showMigrationInfo.description': 'Visualizza informazioni di debug sulle migrazioni dei dati.',
    'settings.about.title': 'Informazioni',
    'settings.about.description': 'Kritzel - Un’applicazione per disegnare',

    // Export dialog
    'export.dialogTitle': 'Esporta',
    'export.tabs.viewport': "Esporta l'area di visualizzazione",
    'export.tabs.workspace': 'Esporta lo spazio di lavoro',
    'export.format.label': 'Formato',
    'export.filename.label': 'Nome file',
    'export.filename.placeholder': 'Inserisci il nome del file',
    'export.exportButton': 'Esporta',

    // Workspace manager
    'workspace.sharedTooltip': 'Spazio di lavoro condiviso',
    'workspace.rename': 'Rinomina',
    'workspace.delete': 'Elimina',

    // Zoom panel
    'zoom.zoomIn': 'Ingrandisci',
    'zoom.zoomOut': 'Riduci',

    // Chat box
    'chatBox.placeholder': 'Chiedi all\'IA...',
    'chatBox.submit': 'Invia',
    'chatBox.stop': 'Interrompi',

    // Utility panel
    'utility.undo': 'Annulla',
    'utility.redo': 'Ripristina',
    'utility.delete': 'Elimina gli elementi selezionati',

    // Share dialog
    'share.dialogTitle': 'Condividi lo spazio di lavoro',
    'share.linkSharing.label': 'Condivisione tramite link',
    'share.linkSharing.enabledDescription': 'Chiunque abbia il link può accedere a questo spazio di lavoro.',
    'share.linkSharing.disabledDescription': 'La condivisione tramite link è disattivata. Solo tu puoi accedere a questo spazio di lavoro.',
    'share.linkSharing.toggleLabel': 'Attiva la condivisione tramite link',
    'share.copyLink.title': 'Copia link',
    'share.copyLink.copied': 'Copiato!',

    // Login dialog
    'login.dialogTitle': 'Accedi',

    // Current user dialog
    'currentUser.dialogTitle': 'Account',

    // Back to content
    'backToContent.label': 'Torna al contenuto',

    // Tool config
    'toolConfig.collapse': 'Comprimi',
    'toolConfig.expand': 'Espandi',

    // More menu button
    'moreMenu.ariaLabel': 'Altre opzioni',

    // Editor
    'editor.loading': 'Caricamento...',

    // Watermark
    'watermark.poweredBy': 'Offerto da Kritzel',
  },
};
