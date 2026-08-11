import { KritzelLocale } from '../interfaces/localization.interface';

/**
 * Built-in French locale.
 */
export const FR_LOCALE: KritzelLocale = {
  code: 'fr',
  label: 'Français',
  terms: {
    // Context menu
    'menu.copy': 'Copier',
    'menu.cut': 'Couper',
    'menu.paste': 'Coller',
    'menu.selectAll': 'Tout sélectionner',
    'menu.order': 'Ordre',
    'menu.bringToFront': 'Mettre au premier plan',
    'menu.sendToBack': "Mettre à l'arrière-plan",
    'menu.moveUp': 'Avancer',
    'menu.moveDown': 'Reculer',
    'menu.align': 'Aligner',
    'menu.alignLeft': 'Aligner à gauche',
    'menu.alignCenterHorizontal': 'Centrer horizontalement',
    'menu.alignRight': 'Aligner à droite',
    'menu.alignTop': 'Aligner en haut',
    'menu.alignCenterVertical': 'Centrer verticalement',
    'menu.alignBottom': 'Aligner en bas',
    'menu.group': 'Grouper',
    'menu.ungroup': 'Dégrouper',
    'menu.export': 'Exporter',
    'menu.exportAsSvg': 'Exporter en SVG',
    'menu.exportAsPng': 'Exporter en PNG',
    'menu.delete': 'Supprimer',

    // More menu
    'menu.share': 'Partager',
    'menu.import': 'Importer',
    'menu.settings': 'Paramètres',
    'menu.logout': 'Déconnexion',

    // Settings dialog
    'settings.dialogTitle': 'Paramètres',
    'settings.categories.general': 'Général',
    'settings.categories.viewport': "Fenêtre d'affichage",
    'settings.categories.shortcuts': 'Raccourcis clavier',
    'settings.categories.developer': 'Options développeur',
    'settings.categories.about': 'À propos',
    'settings.general.title': 'Paramètres généraux',
    'settings.general.theme.label': 'Thème',
    'settings.general.theme.description': "Sélectionnez un thème de couleurs enregistré pour l'interface de l'éditeur.",
    'settings.general.language.label': 'Langue',
    'settings.general.language.description': "Sélectionnez la langue d'affichage de l'interface de l'éditeur.",
    'settings.general.lockDrawingScale.label': "Verrouiller l'échelle de dessin",
    'settings.general.lockDrawingScale.description': "Lorsque cette option est activée, les objets dessinés conservent une taille visuelle fixe quel que soit le niveau de zoom actuel.",
    'settings.viewport.title': "Paramètres de la fenêtre d'affichage",
    'settings.viewport.minZoom.label': 'Niveau de zoom minimal',
    'settings.viewport.minZoom.description': 'Définit le niveau de zoom minimal. Des valeurs plus faibles permettent de dézoomer davantage pour voir une plus grande partie du canevas.',
    'settings.viewport.maxZoom.label': 'Niveau de zoom maximal',
    'settings.viewport.maxZoom.description': 'Définit le niveau de zoom maximal. Des valeurs plus élevées permettent de zoomer davantage pour un travail détaillé.',
    'settings.viewport.boundaryLeft.label': "Limite gauche de la fenêtre d'affichage",
    'settings.viewport.boundaryLeft.description': "Limite gauche en coordonnées du monde. Définissez jusqu'où la fenêtre d'affichage peut se déplacer vers la gauche.",
    'settings.viewport.boundaryRight.label': "Limite droite de la fenêtre d'affichage",
    'settings.viewport.boundaryRight.description': "Limite droite en coordonnées du monde. Définissez jusqu'où la fenêtre d'affichage peut se déplacer vers la droite.",
    'settings.viewport.boundaryTop.label': "Limite supérieure de la fenêtre d'affichage",
    'settings.viewport.boundaryTop.description': "Limite supérieure en coordonnées du monde. Définissez jusqu'où la fenêtre d'affichage peut se déplacer vers le haut.",
    'settings.viewport.boundaryBottom.label': "Limite inférieure de la fenêtre d'affichage",
    'settings.viewport.boundaryBottom.description': "Limite inférieure en coordonnées du monde. Définissez jusqu'où la fenêtre d'affichage peut se déplacer vers le bas.",
    'settings.viewport.boundaryPlaceholder': 'Infini',
    'settings.shortcuts.title': 'Raccourcis clavier',
    'settings.developer.title': 'Options développeur',
    'settings.developer.showViewportInfo.label': "Afficher les infos de la fenêtre d'affichage",
    'settings.developer.showViewportInfo.description': "Affiche les informations de débogage de la fenêtre d'affichage telles que la position, le niveau de zoom et les limites.",
    'settings.developer.showObjectInfo.label': 'Afficher les infos des objets',
    'settings.developer.showObjectInfo.description': 'Affiche les informations de débogage des objets sur le canevas.',
    'settings.developer.showSyncProviderInfo.label': 'Afficher les infos du fournisseur de synchronisation',
    'settings.developer.showSyncProviderInfo.description': "Affiche les informations de débogage sur l'état de connexion du fournisseur de synchronisation.",
    'settings.developer.showMigrationInfo.label': 'Afficher les infos de migration',
    'settings.developer.showMigrationInfo.description': 'Affiche les informations de débogage sur les migrations de données.',
    'settings.about.title': 'À propos',
    'settings.about.description': 'Kritzel - Une application de dessin',

    // Export dialog
    'export.dialogTitle': 'Exporter',
    'export.tabs.viewport': "Exporter la fenêtre d'affichage",
    'export.tabs.workspace': "Exporter l'espace de travail",
    'export.format.label': 'Format',
    'export.filename.label': 'Nom du fichier',
    'export.filename.placeholder': 'Saisir le nom du fichier',
    'export.exportButton': 'Exporter',

    // Workspace manager
    'workspace.sharedTooltip': 'Espace de travail partagé',
    'workspace.rename': 'Renommer',
    'workspace.delete': 'Supprimer',

    // Zoom panel
    'zoom.zoomIn': 'Zoom avant',
    'zoom.zoomOut': 'Zoom arrière',

    // Utility panel
    'utility.undo': 'Annuler',
    'utility.redo': 'Rétablir',
    'utility.delete': 'Supprimer les éléments sélectionnés',

    // Share dialog
    'share.dialogTitle': "Partager l'espace de travail",
    'share.linkSharing.label': 'Partage par lien',
    'share.linkSharing.enabledDescription': 'Toute personne disposant du lien peut accéder à cet espace de travail.',
    'share.linkSharing.disabledDescription': 'Le partage par lien est désactivé. Vous seul pouvez accéder à cet espace de travail.',
    'share.linkSharing.toggleLabel': 'Activer le partage par lien',
    'share.copyLink.title': 'Copier le lien',
    'share.copyLink.copied': 'Copié !',

    // Login dialog
    'login.dialogTitle': 'Se connecter',

    // Current user dialog
    'currentUser.dialogTitle': 'Compte',

    // Back to content
    'backToContent.label': 'Retour au contenu',

    // Tool config
    'toolConfig.collapse': 'Réduire',
    'toolConfig.expand': 'Développer',

    // More menu button
    'moreMenu.ariaLabel': "Plus d'options",

    // Editor
    'editor.loading': 'Chargement...',

    // Watermark
    'watermark.poweredBy': 'Propulsé par Kritzel',
  },
};
