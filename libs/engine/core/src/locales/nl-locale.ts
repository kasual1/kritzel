import { KritzelLocale } from '../interfaces/localization.interface';

/**
 * Built-in Dutch locale.
 */
export const NL_LOCALE: KritzelLocale = {
  code: 'nl',
  label: 'Nederlands',
  terms: {
    // Context menu
    'menu.copy': 'Kopiëren',
    'menu.cut': 'Knippen',
    'menu.paste': 'Plakken',
    'menu.selectAll': 'Alles selecteren',
    'menu.order': 'Volgorde',
    'menu.bringToFront': 'Naar voren halen',
    'menu.sendToBack': 'Naar achteren plaatsen',
    'menu.moveUp': 'Omhoog verplaatsen',
    'menu.moveDown': 'Omlaag verplaatsen',
    'menu.align': 'Uitlijnen',
    'menu.alignLeft': 'Links uitlijnen',
    'menu.alignCenterHorizontal': 'Horizontaal centreren',
    'menu.alignRight': 'Rechts uitlijnen',
    'menu.alignTop': 'Boven uitlijnen',
    'menu.alignCenterVertical': 'Verticaal centreren',
    'menu.alignBottom': 'Onder uitlijnen',
    'menu.group': 'Groeperen',
    'menu.ungroup': 'Groepering opheffen',
    'menu.export': 'Exporteren',
    'menu.exportAsSvg': 'Exporteren als SVG',
    'menu.exportAsPng': 'Exporteren als PNG',
    'menu.delete': 'Verwijderen',

    // More menu
    'menu.share': 'Delen',
    'menu.import': 'Importeren',
    'menu.settings': 'Instellingen',
    'menu.logout': 'Uitloggen',

    // Settings dialog
    'settings.dialogTitle': 'Instellingen',
    'settings.categories.general': 'Algemeen',
    'settings.categories.viewport': 'Weergavegebied',
    'settings.categories.shortcuts': 'Sneltoetsen',
    'settings.categories.developer': 'Ontwikkelaarsopties',
    'settings.categories.about': 'Over',
    'settings.general.title': 'Algemene instellingen',
    'settings.general.theme.label': 'Thema',
    'settings.general.theme.description': 'Selecteer een geregistreerd kleurenthema voor de editorinterface.',
    'settings.general.language.label': 'Taal',
    'settings.general.language.description': 'Selecteer de weergavetaal voor de editorinterface.',
    'settings.general.lockDrawingScale.label': 'Tekenschaal vergrendelen',
    'settings.general.lockDrawingScale.description': 'Indien ingeschakeld behouden getekende objecten een vaste visuele grootte, ongeacht het huidige zoomniveau.',
    'settings.viewport.title': 'Instellingen voor weergavegebied',
    'settings.viewport.minZoom.label': 'Minimaal zoomniveau',
    'settings.viewport.minZoom.description': 'Stelt het minimale zoomniveau in. Lagere waarden maken verder uitzoomen mogelijk, zodat meer van het canvas zichtbaar is.',
    'settings.viewport.maxZoom.label': 'Maximaal zoomniveau',
    'settings.viewport.maxZoom.description': 'Stelt het maximale zoomniveau in. Hogere waarden maken verder inzoomen mogelijk voor gedetailleerd werk.',
    'settings.viewport.boundaryLeft.label': 'Linkergrens van weergavegebied',
    'settings.viewport.boundaryLeft.description': 'Linkergrens in wereldcoördinaten. Bepaalt hoe ver het weergavegebied naar links kan worden verplaatst.',
    'settings.viewport.boundaryRight.label': 'Rechtergrens van weergavegebied',
    'settings.viewport.boundaryRight.description': 'Rechtergrens in wereldcoördinaten. Bepaalt hoe ver het weergavegebied naar rechts kan worden verplaatst.',
    'settings.viewport.boundaryTop.label': 'Bovengrens van weergavegebied',
    'settings.viewport.boundaryTop.description': 'Bovengrens in wereldcoördinaten. Bepaalt hoe ver het weergavegebied omhoog kan worden verplaatst.',
    'settings.viewport.boundaryBottom.label': 'Ondergrens van weergavegebied',
    'settings.viewport.boundaryBottom.description': 'Ondergrens in wereldcoördinaten. Bepaalt hoe ver het weergavegebied omlaag kan worden verplaatst.',
    'settings.viewport.boundaryPlaceholder': 'Oneindig',
    'settings.shortcuts.title': 'Sneltoetsen',
    'settings.developer.title': 'Ontwikkelaarsopties',
    'settings.developer.showViewportInfo.label': 'Weergavegebiedinfo tonen',
    'settings.developer.showViewportInfo.description': 'Toont foutopsporingsinformatie over het weergavegebied, zoals positie, zoomniveau en grenzen.',
    'settings.developer.showObjectInfo.label': 'Objectinformatie tonen',
    'settings.developer.showObjectInfo.description': 'Toont foutopsporingsinformatie over objecten op het canvas.',
    'settings.developer.showSyncProviderInfo.label': 'Synchronisatieproviderinformatie tonen',
    'settings.developer.showSyncProviderInfo.description': 'Toont foutopsporingsinformatie over de verbindingsstatus van de synchronisatieprovider.',
    'settings.developer.showMigrationInfo.label': 'Migratie-informatie tonen',
    'settings.developer.showMigrationInfo.description': 'Toont foutopsporingsinformatie over gegevensmigraties.',
    'settings.about.title': 'Over',
    'settings.about.description': 'Kritzel - Een tekenapplicatie',

    // Export dialog
    'export.dialogTitle': 'Exporteren',
    'export.tabs.viewport': 'Weergavegebied exporteren',
    'export.tabs.workspace': 'Werkruimte exporteren',
    'export.format.label': 'Indeling',
    'export.filename.label': 'Bestandsnaam',
    'export.filename.placeholder': 'Voer de bestandsnaam in',
    'export.exportButton': 'Exporteren',

    // Workspace manager
    'workspace.sharedTooltip': 'Gedeelde werkruimte',
    'workspace.rename': 'Naam wijzigen',
    'workspace.delete': 'Verwijderen',

    // Zoom panel
    'zoom.zoomIn': 'Inzoomen',
    'zoom.zoomOut': 'Uitzoomen',

    // Chat box
    'chatBox.placeholder': 'Vraag het de AI...',
    'chatBox.submit': 'Versturen',

    // Utility panel
    'utility.undo': 'Ongedaan maken',
    'utility.redo': 'Opnieuw uitvoeren',
    'utility.delete': 'Geselecteerde items verwijderen',

    // Share dialog
    'share.dialogTitle': 'Werkruimte delen',
    'share.linkSharing.label': 'Delen via link',
    'share.linkSharing.enabledDescription': 'Iedereen met de link heeft toegang tot deze werkruimte.',
    'share.linkSharing.disabledDescription': 'Delen via link is uitgeschakeld. Alleen jij hebt toegang tot deze werkruimte.',
    'share.linkSharing.toggleLabel': 'Delen via link inschakelen',
    'share.copyLink.title': 'Link kopiëren',
    'share.copyLink.copied': 'Gekopieerd!',

    // Login dialog
    'login.dialogTitle': 'Aanmelden',

    // Current user dialog
    'currentUser.dialogTitle': 'Account',

    // Back to content
    'backToContent.label': 'Terug naar inhoud',

    // Tool config
    'toolConfig.collapse': 'Inklappen',
    'toolConfig.expand': 'Uitklappen',

    // More menu button
    'moreMenu.ariaLabel': 'Meer opties',

    // Editor
    'editor.loading': 'Laden...',

    // Watermark
    'watermark.poweredBy': 'Mogelijk gemaakt door Kritzel',
  },
};
