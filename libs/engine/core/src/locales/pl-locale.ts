import { KritzelLocale } from '../interfaces/localization.interface';

/**
 * Built-in Polish locale.
 */
export const PL_LOCALE: KritzelLocale = {
  code: 'pl',
  label: 'Polski',
  terms: {
    // Context menu
    'menu.copy': 'Kopiuj',
    'menu.cut': 'Wytnij',
    'menu.paste': 'Wklej',
    'menu.selectAll': 'Zaznacz wszystko',
    'menu.order': 'Kolejność',
    'menu.bringToFront': 'Przenieś na wierzch',
    'menu.sendToBack': 'Przenieś na spód',
    'menu.moveUp': 'Przesuń w górę',
    'menu.moveDown': 'Przesuń w dół',
    'menu.align': 'Wyrównaj',
    'menu.alignLeft': 'Wyrównaj do lewej',
    'menu.alignCenterHorizontal': 'Wyrównaj do środka w poziomie',
    'menu.alignRight': 'Wyrównaj do prawej',
    'menu.alignTop': 'Wyrównaj do góry',
    'menu.alignCenterVertical': 'Wyrównaj do środka w pionie',
    'menu.alignBottom': 'Wyrównaj do dołu',
    'menu.group': 'Grupuj',
    'menu.ungroup': 'Rozgrupuj',
    'menu.export': 'Eksportuj',
    'menu.exportAsSvg': 'Eksportuj jako SVG',
    'menu.exportAsPng': 'Eksportuj jako PNG',
    'menu.delete': 'Usuń',

    // More menu
    'menu.share': 'Udostępnij',
    'menu.import': 'Importuj',
    'menu.settings': 'Ustawienia',
    'menu.logout': 'Wyloguj się',

    // Settings dialog
    'settings.dialogTitle': 'Ustawienia',
    'settings.categories.general': 'Ogólne',
    'settings.categories.viewport': 'Obszar widoku',
    'settings.categories.shortcuts': 'Skróty klawiszowe',
    'settings.categories.developer': 'Opcje programistyczne',
    'settings.categories.about': 'Informacje',
    'settings.general.title': 'Ustawienia ogólne',
    'settings.general.theme.label': 'Motyw',
    'settings.general.theme.description': 'Wybierz zarejestrowany motyw kolorystyczny interfejsu edytora.',
    'settings.general.language.label': 'Język',
    'settings.general.language.description': 'Wybierz język wyświetlania interfejsu edytora.',
    'settings.general.lockDrawingScale.label': 'Zablokuj skalę rysowania',
    'settings.general.lockDrawingScale.description': 'Po włączeniu narysowane obiekty zachowują stały rozmiar wizualny niezależnie od bieżącego poziomu powiększenia.',
    'settings.viewport.title': 'Ustawienia obszaru widoku',
    'settings.viewport.minZoom.label': 'Minimalny poziom powiększenia',
    'settings.viewport.minZoom.description': 'Ustawia minimalny poziom powiększenia. Niższe wartości pozwalają bardziej oddalić widok, aby zobaczyć większą część obszaru roboczego.',
    'settings.viewport.maxZoom.label': 'Maksymalny poziom powiększenia',
    'settings.viewport.maxZoom.description': 'Ustawia maksymalny poziom powiększenia. Wyższe wartości pozwalają przybliżyć widok do szczegółowej pracy.',
    'settings.viewport.boundaryLeft.label': 'Lewa granica obszaru widoku',
    'settings.viewport.boundaryLeft.description': 'Lewa granica we współrzędnych świata. Określa, jak daleko obszar widoku może przesunąć się w lewo.',
    'settings.viewport.boundaryRight.label': 'Prawa granica obszaru widoku',
    'settings.viewport.boundaryRight.description': 'Prawa granica we współrzędnych świata. Określa, jak daleko obszar widoku może przesunąć się w prawo.',
    'settings.viewport.boundaryTop.label': 'Górna granica obszaru widoku',
    'settings.viewport.boundaryTop.description': 'Górna granica we współrzędnych świata. Określa, jak daleko obszar widoku może przesunąć się w górę.',
    'settings.viewport.boundaryBottom.label': 'Dolna granica obszaru widoku',
    'settings.viewport.boundaryBottom.description': 'Dolna granica we współrzędnych świata. Określa, jak daleko obszar widoku może przesunąć się w dół.',
    'settings.viewport.boundaryPlaceholder': 'Bez ograniczeń',
    'settings.shortcuts.title': 'Skróty klawiszowe',
    'settings.developer.title': 'Opcje programistyczne',
    'settings.developer.showViewportInfo.label': 'Pokaż informacje o obszarze widoku',
    'settings.developer.showViewportInfo.description': 'Wyświetla informacje diagnostyczne o obszarze widoku, takie jak położenie, poziom powiększenia i granice.',
    'settings.developer.showObjectInfo.label': 'Pokaż informacje o obiektach',
    'settings.developer.showObjectInfo.description': 'Wyświetla informacje diagnostyczne o obiektach na obszarze roboczym.',
    'settings.developer.showSyncProviderInfo.label': 'Pokaż informacje o dostawcy synchronizacji',
    'settings.developer.showSyncProviderInfo.description': 'Wyświetla informacje diagnostyczne o stanie połączenia dostawcy synchronizacji.',
    'settings.developer.showMigrationInfo.label': 'Pokaż informacje o migracji',
    'settings.developer.showMigrationInfo.description': 'Wyświetla informacje diagnostyczne o migracjach danych.',
    'settings.about.title': 'Informacje',
    'settings.about.description': 'Kritzel — aplikacja do rysowania',

    // Export dialog
    'export.dialogTitle': 'Eksportuj',
    'export.tabs.viewport': 'Eksportuj obszar widoku',
    'export.tabs.workspace': 'Eksportuj obszar roboczy',
    'export.format.label': 'Format',
    'export.filename.label': 'Nazwa pliku',
    'export.filename.placeholder': 'Wpisz nazwę pliku',
    'export.exportButton': 'Eksportuj',

    // Workspace manager
    'workspace.sharedTooltip': 'Udostępniony obszar roboczy',
    'workspace.rename': 'Zmień nazwę',
    'workspace.delete': 'Usuń',

    // Zoom panel
    'zoom.zoomIn': 'Powiększ',
    'zoom.zoomOut': 'Pomniejsz',

    // Chat box
    'chatBox.placeholder': 'Zapytaj AI...',
    'chatBox.submit': 'Wyślij',
    'chatBox.stop': 'Zatrzymaj',

    // Utility panel
    'utility.undo': 'Cofnij',
    'utility.redo': 'Ponów',
    'utility.delete': 'Usuń zaznaczone elementy',

    // Share dialog
    'share.dialogTitle': 'Udostępnij obszar roboczy',
    'share.linkSharing.label': 'Udostępnianie przez link',
    'share.linkSharing.enabledDescription': 'Każda osoba mająca link może uzyskać dostęp do tego obszaru roboczego.',
    'share.linkSharing.disabledDescription': 'Udostępnianie przez link jest wyłączone. Tylko Ty masz dostęp do tego obszaru roboczego.',
    'share.linkSharing.toggleLabel': 'Włącz udostępnianie przez link',
    'share.copyLink.title': 'Kopiuj link',
    'share.copyLink.copied': 'Skopiowano!',

    // Login dialog
    'login.dialogTitle': 'Zaloguj się',

    // Current user dialog
    'currentUser.dialogTitle': 'Konto',

    // Back to content
    'backToContent.label': 'Wróć do treści',

    // Tool config
    'toolConfig.collapse': 'Zwiń',
    'toolConfig.expand': 'Rozwiń',

    // More menu button
    'moreMenu.ariaLabel': 'Więcej opcji',

    // Editor
    'editor.loading': 'Ładowanie...',

    // Watermark
    'watermark.poweredBy': 'Obsługiwane przez Kritzel',
  },
};
