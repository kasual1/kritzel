import { KritzelLocale } from '../interfaces/localization.interface';

/**
 * Built-in Spanish locale.
 */
export const ES_LOCALE: KritzelLocale = {
  code: 'es',
  label: 'Español',
  terms: {
    // Context menu
    'menu.copy': 'Copiar',
    'menu.cut': 'Cortar',
    'menu.paste': 'Pegar',
    'menu.selectAll': 'Seleccionar todo',
    'menu.order': 'Orden',
    'menu.bringToFront': 'Traer al frente',
    'menu.sendToBack': 'Enviar al fondo',
    'menu.moveUp': 'Mover hacia arriba',
    'menu.moveDown': 'Mover hacia abajo',
    'menu.align': 'Alinear',
    'menu.alignLeft': 'Alinear a la izquierda',
    'menu.alignCenterHorizontal': 'Alinear horizontalmente al centro',
    'menu.alignRight': 'Alinear a la derecha',
    'menu.alignTop': 'Alinear arriba',
    'menu.alignCenterVertical': 'Alinear verticalmente al centro',
    'menu.alignBottom': 'Alinear abajo',
    'menu.group': 'Agrupar',
    'menu.ungroup': 'Desagrupar',
    'menu.export': 'Exportar',
    'menu.exportAsSvg': 'Exportar como SVG',
    'menu.exportAsPng': 'Exportar como PNG',
    'menu.delete': 'Eliminar',

    // More menu
    'menu.share': 'Compartir',
    'menu.import': 'Importar',
    'menu.settings': 'Configuración',
    'menu.logout': 'Cerrar sesión',

    // Settings dialog
    'settings.dialogTitle': 'Configuración',
    'settings.categories.general': 'General',
    'settings.categories.viewport': 'Área de visualización',
    'settings.categories.shortcuts': 'Atajos de teclado',
    'settings.categories.developer': 'Opciones de desarrollador',
    'settings.categories.about': 'Acerca de',
    'settings.general.title': 'Configuración general',
    'settings.general.theme.label': 'Tema',
    'settings.general.theme.description': 'Selecciona un tema de color registrado para la interfaz del editor.',
    'settings.general.language.label': 'Idioma',
    'settings.general.language.description': 'Selecciona el idioma de visualización de la interfaz del editor.',
    'settings.general.lockDrawingScale.label': 'Bloquear escala del dibujo',
    'settings.general.lockDrawingScale.description': 'Cuando está activado, los objetos dibujados mantienen un tamaño visual fijo independientemente del nivel de zoom actual.',
    'settings.viewport.title': 'Configuración del área de visualización',
    'settings.viewport.minZoom.label': 'Nivel mínimo de zoom',
    'settings.viewport.minZoom.description': 'Establece el nivel mínimo de zoom. Los valores más bajos permiten alejarse más para ver una mayor parte del lienzo.',
    'settings.viewport.maxZoom.label': 'Nivel máximo de zoom',
    'settings.viewport.maxZoom.description': 'Establece el nivel máximo de zoom. Los valores más altos permiten acercarse para trabajar con más detalle.',
    'settings.viewport.boundaryLeft.label': 'Límite izquierdo del área de visualización',
    'settings.viewport.boundaryLeft.description': 'Límite izquierdo en coordenadas del mundo. Establece hasta dónde puede desplazarse el área de visualización hacia la izquierda.',
    'settings.viewport.boundaryRight.label': 'Límite derecho del área de visualización',
    'settings.viewport.boundaryRight.description': 'Límite derecho en coordenadas del mundo. Establece hasta dónde puede desplazarse el área de visualización hacia la derecha.',
    'settings.viewport.boundaryTop.label': 'Límite superior del área de visualización',
    'settings.viewport.boundaryTop.description': 'Límite superior en coordenadas del mundo. Establece hasta dónde puede desplazarse el área de visualización hacia arriba.',
    'settings.viewport.boundaryBottom.label': 'Límite inferior del área de visualización',
    'settings.viewport.boundaryBottom.description': 'Límite inferior en coordenadas del mundo. Establece hasta dónde puede desplazarse el área de visualización hacia abajo.',
    'settings.viewport.boundaryPlaceholder': 'Infinito',
    'settings.shortcuts.title': 'Atajos de teclado',
    'settings.developer.title': 'Opciones de desarrollador',
    'settings.developer.showViewportInfo.label': 'Mostrar información del área de visualización',
    'settings.developer.showViewportInfo.description': 'Muestra información de depuración del área de visualización, como la posición, el nivel de zoom y los límites.',
    'settings.developer.showObjectInfo.label': 'Mostrar información de los objetos',
    'settings.developer.showObjectInfo.description': 'Muestra información de depuración sobre los objetos del lienzo.',
    'settings.developer.showSyncProviderInfo.label': 'Mostrar información del proveedor de sincronización',
    'settings.developer.showSyncProviderInfo.description': 'Muestra información de depuración sobre el estado de conexión del proveedor de sincronización.',
    'settings.developer.showMigrationInfo.label': 'Mostrar información de migración',
    'settings.developer.showMigrationInfo.description': 'Muestra información de depuración sobre las migraciones de datos.',
    'settings.about.title': 'Acerca de',
    'settings.about.description': 'Kritzel - Una aplicación de dibujo',

    // Export dialog
    'export.dialogTitle': 'Exportar',
    'export.tabs.viewport': 'Exportar área de visualización',
    'export.tabs.workspace': 'Exportar espacio de trabajo',
    'export.format.label': 'Formato',
    'export.filename.label': 'Nombre del archivo',
    'export.filename.placeholder': 'Introduce el nombre del archivo',
    'export.exportButton': 'Exportar',

    // Workspace manager
    'workspace.sharedTooltip': 'Espacio de trabajo compartido',
    'workspace.rename': 'Cambiar nombre',
    'workspace.delete': 'Eliminar',

    // Zoom panel
    'zoom.zoomIn': 'Acercar',
    'zoom.zoomOut': 'Alejar',

    // Chat box
    'chatBox.placeholder': 'Pregunta a la IA...',
    'chatBox.submit': 'Enviar',
    'chatBox.stop': 'Detener',

    // Utility panel
    'utility.undo': 'Deshacer',
    'utility.redo': 'Rehacer',
    'utility.delete': 'Eliminar elementos seleccionados',

    // Share dialog
    'share.dialogTitle': 'Compartir espacio de trabajo',
    'share.linkSharing.label': 'Compartir mediante enlace',
    'share.linkSharing.enabledDescription': 'Cualquier persona con el enlace puede acceder a este espacio de trabajo.',
    'share.linkSharing.disabledDescription': 'El uso compartido mediante enlace está desactivado. Solo tú puedes acceder a este espacio de trabajo.',
    'share.linkSharing.toggleLabel': 'Activar el uso compartido mediante enlace',
    'share.copyLink.title': 'Copiar enlace',
    'share.copyLink.copied': '¡Copiado!',

    // Login dialog
    'login.dialogTitle': 'Iniciar sesión',

    // Current user dialog
    'currentUser.dialogTitle': 'Cuenta',

    // Back to content
    'backToContent.label': 'Volver al contenido',

    // Tool config
    'toolConfig.collapse': 'Contraer',
    'toolConfig.expand': 'Expandir',

    // More menu button
    'moreMenu.ariaLabel': 'Más opciones',

    // Watermark
    'watermark.poweredBy': 'Desarrollado por Kritzel',

    // Object type labels
    'objectType.shape': 'Forma',
    'objectType.text': 'Texto',
    'objectType.image': 'Imagen',
    'objectType.path': 'Dibujo',
    'objectType.line': 'Línea',
    'objectType.group': 'Grupo',
    'objectType.iframe': 'Insertado',
    'objectType.dynamic': 'Componente',
    'objectType.object': 'Objeto',
  },
};
