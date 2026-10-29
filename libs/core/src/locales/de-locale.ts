import { KritzelLocale } from '../interfaces/localization.interface';

/**
 * Built-in German locale.
 */
export const DE_LOCALE: KritzelLocale = {
  code: 'de',
  label: 'Deutsch',
  terms: {
    // Context menu
    'menu.copy': 'Kopieren',
    'menu.cut': 'Ausschneiden',
    'menu.paste': 'Einfügen',
    'menu.selectAll': 'Alles auswählen',
    'menu.order': 'Anordnen',
    'menu.bringToFront': 'In den Vordergrund',
    'menu.sendToBack': 'In den Hintergrund',
    'menu.moveUp': 'Nach vorne',
    'menu.moveDown': 'Nach hinten',
    'menu.align': 'Ausrichten',
    'menu.alignLeft': 'Linksbündig ausrichten',
    'menu.alignCenterHorizontal': 'Horizontal zentrieren',
    'menu.alignRight': 'Rechtsbündig ausrichten',
    'menu.alignTop': 'Oben ausrichten',
    'menu.alignCenterVertical': 'Vertikal zentrieren',
    'menu.alignBottom': 'Unten ausrichten',
    'menu.group': 'Gruppieren',
    'menu.ungroup': 'Gruppierung aufheben',
    'menu.export': 'Exportieren',
    'menu.exportAsSvg': 'Als SVG exportieren',
    'menu.exportAsPng': 'Als PNG exportieren',
    'menu.delete': 'Löschen',

    // More menu
    'menu.share': 'Teilen',
    'menu.import': 'Importieren',
    'menu.settings': 'Einstellungen',
    'menu.logout': 'Abmelden',

    // Settings dialog
    'settings.dialogTitle': 'Einstellungen',
    'settings.categories.general': 'Allgemein',
    'settings.categories.viewport': 'Ansichtsfenster',
    'settings.categories.shortcuts': 'Tastenkürzel',
    'settings.categories.developer': 'Entwickleroptionen',
    'settings.categories.about': 'Über',
    'settings.general.title': 'Allgemeine Einstellungen',
    'settings.general.theme.label': 'Design',
    'settings.general.theme.description': 'Wählen Sie ein registriertes Farbdesign für die Editor-Oberfläche.',
    'settings.general.language.label': 'Sprache',
    'settings.general.language.description': 'Wählen Sie die Anzeigesprache für die Editor-Oberfläche.',
    'settings.general.lockDrawingScale.label': 'Zeichenskalierung sperren',
    'settings.general.lockDrawingScale.description': 'Wenn aktiviert, behalten gezeichnete Objekte unabhängig von der aktuellen Zoomstufe eine feste visuelle Größe.',
    'settings.viewport.title': 'Ansichtsfenster-Einstellungen',
    'settings.viewport.minZoom.label': 'Minimale Zoomstufe',
    'settings.viewport.minZoom.description': 'Legt die minimale Zoomstufe fest. Niedrigere Werte ermöglichen weiteres Herauszoomen, um mehr von der Zeichenfläche zu sehen.',
    'settings.viewport.maxZoom.label': 'Maximale Zoomstufe',
    'settings.viewport.maxZoom.description': 'Legt die maximale Zoomstufe fest. Höhere Werte ermöglichen näheres Heranzoomen für Detailarbeit.',
    'settings.viewport.boundaryLeft.label': 'Ansichtsfenster-Grenze links',
    'settings.viewport.boundaryLeft.description': 'Linke Grenze in Weltkoordinaten. Legen Sie fest, wie weit das Ansichtsfenster nach links verschoben werden kann.',
    'settings.viewport.boundaryRight.label': 'Ansichtsfenster-Grenze rechts',
    'settings.viewport.boundaryRight.description': 'Rechte Grenze in Weltkoordinaten. Legen Sie fest, wie weit das Ansichtsfenster nach rechts verschoben werden kann.',
    'settings.viewport.boundaryTop.label': 'Ansichtsfenster-Grenze oben',
    'settings.viewport.boundaryTop.description': 'Obere Grenze in Weltkoordinaten. Legen Sie fest, wie weit das Ansichtsfenster nach oben verschoben werden kann.',
    'settings.viewport.boundaryBottom.label': 'Ansichtsfenster-Grenze unten',
    'settings.viewport.boundaryBottom.description': 'Untere Grenze in Weltkoordinaten. Legen Sie fest, wie weit das Ansichtsfenster nach unten verschoben werden kann.',
    'settings.viewport.boundaryPlaceholder': 'Unendlich',
    'settings.shortcuts.title': 'Tastenkürzel',
    'settings.developer.title': 'Entwickleroptionen',
    'settings.developer.showViewportInfo.label': 'Ansichtsfenster-Infos anzeigen',
    'settings.developer.showViewportInfo.description': 'Zeigt Debug-Informationen zum Ansichtsfenster an, z. B. Position, Zoomstufe und Grenzen.',
    'settings.developer.showObjectInfo.label': 'Objekt-Infos anzeigen',
    'settings.developer.showObjectInfo.description': 'Zeigt Debug-Informationen zu Objekten auf der Zeichenfläche an.',
    'settings.developer.showSyncProviderInfo.label': 'Sync-Provider-Infos anzeigen',
    'settings.developer.showSyncProviderInfo.description': 'Zeigt Debug-Informationen zum Verbindungsstatus des Sync-Providers an.',
    'settings.developer.showMigrationInfo.label': 'Migrations-Infos anzeigen',
    'settings.developer.showMigrationInfo.description': 'Zeigt Debug-Informationen zu Datenmigrationen an.',
    'settings.about.title': 'Über',
    'settings.about.description': 'Kritzel – Eine Zeichenanwendung',

    // Export dialog
    'export.dialogTitle': 'Exportieren',
    'export.tabs.viewport': 'Ansichtsfenster exportieren',
    'export.tabs.workspace': 'Arbeitsbereich exportieren',
    'export.format.label': 'Format',
    'export.filename.label': 'Dateiname',
    'export.filename.placeholder': 'Dateiname eingeben',
    'export.exportButton': 'Exportieren',

    // Workspace manager
    'workspace.sharedTooltip': 'Geteilter Arbeitsbereich',
    'workspace.rename': 'Umbenennen',
    'workspace.delete': 'Löschen',

    // Zoom panel
    'zoom.zoomIn': 'Vergrößern',
    'zoom.zoomOut': 'Verkleinern',

    // Chat box
    'chatBox.placeholder': 'Frag die KI...',
    'chatBox.submit': 'Senden',
    'chatBox.stop': 'Stoppen',

    // Utility panel
    'utility.undo': 'Rückgängig',
    'utility.redo': 'Wiederholen',
    'utility.delete': 'Ausgewählte Elemente löschen',

    // Share dialog
    'share.dialogTitle': 'Arbeitsbereich teilen',
    'share.linkSharing.label': 'Link-Freigabe',
    'share.linkSharing.enabledDescription': 'Jeder mit dem Link kann auf diesen Arbeitsbereich zugreifen.',
    'share.linkSharing.disabledDescription': 'Die Link-Freigabe ist deaktiviert. Nur Sie können auf diesen Arbeitsbereich zugreifen.',
    'share.linkSharing.toggleLabel': 'Link-Freigabe aktivieren',
    'share.copyLink.title': 'Link kopieren',
    'share.copyLink.copied': 'Kopiert!',

    // Login dialog
    'login.dialogTitle': 'Anmelden',

    // Current user dialog
    'currentUser.dialogTitle': 'Konto',

    // Back to content
    'backToContent.label': 'Zurück zum Inhalt',

    // Tool config
    'toolConfig.collapse': 'Einklappen',
    'toolConfig.expand': 'Ausklappen',

    // More menu button
    'moreMenu.ariaLabel': 'Weitere Optionen',

    // Watermark
    'watermark.poweredBy': 'Bereitgestellt von Kritzel',

    // Object type labels
    'objectType.shape': 'Form',
    'objectType.text': 'Text',
    'objectType.image': 'Bild',
    'objectType.path': 'Zeichnung',
    'objectType.line': 'Linie',
    'objectType.group': 'Gruppe',
    'objectType.iframe': 'Einbettung',
    'objectType.dynamic': 'Komponente',
    'objectType.object': 'Objekt',
  },
};
