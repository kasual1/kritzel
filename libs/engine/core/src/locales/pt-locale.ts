import { KritzelLocale } from '../interfaces/localization.interface';

/**
 * Built-in Portuguese locale.
 */
export const PT_LOCALE: KritzelLocale = {
  code: 'pt',
  label: 'Português',
  terms: {
    // Context menu
    'menu.copy': 'Copiar',
    'menu.cut': 'Cortar',
    'menu.paste': 'Colar',
    'menu.selectAll': 'Selecionar tudo',
    'menu.order': 'Ordem',
    'menu.bringToFront': 'Trazer para a frente',
    'menu.sendToBack': 'Enviar para trás',
    'menu.moveUp': 'Mover para cima',
    'menu.moveDown': 'Mover para baixo',
    'menu.align': 'Alinhar',
    'menu.alignLeft': 'Alinhar à esquerda',
    'menu.alignCenterHorizontal': 'Alinhar ao centro horizontalmente',
    'menu.alignRight': 'Alinhar à direita',
    'menu.alignTop': 'Alinhar ao topo',
    'menu.alignCenterVertical': 'Alinhar ao centro verticalmente',
    'menu.alignBottom': 'Alinhar à parte inferior',
    'menu.group': 'Agrupar',
    'menu.ungroup': 'Desagrupar',
    'menu.export': 'Exportar',
    'menu.exportAsSvg': 'Exportar como SVG',
    'menu.exportAsPng': 'Exportar como PNG',
    'menu.delete': 'Excluir',

    // More menu
    'menu.share': 'Compartilhar',
    'menu.import': 'Importar',
    'menu.settings': 'Configurações',
    'menu.logout': 'Sair',

    // Settings dialog
    'settings.dialogTitle': 'Configurações',
    'settings.categories.general': 'Geral',
    'settings.categories.viewport': 'Área de visualização',
    'settings.categories.shortcuts': 'Atalhos de teclado',
    'settings.categories.developer': 'Opções de desenvolvedor',
    'settings.categories.about': 'Sobre',
    'settings.general.title': 'Configurações gerais',
    'settings.general.theme.label': 'Tema',
    'settings.general.theme.description': 'Selecione um tema de cores registrado para a interface do editor.',
    'settings.general.language.label': 'Idioma',
    'settings.general.language.description': 'Selecione o idioma de exibição da interface do editor.',
    'settings.general.lockDrawingScale.label': 'Bloquear escala do desenho',
    'settings.general.lockDrawingScale.description': 'Quando ativado, os objetos desenhados mantêm um tamanho visual fixo independentemente do nível de zoom atual.',
    'settings.viewport.title': 'Configurações da área de visualização',
    'settings.viewport.minZoom.label': 'Nível mínimo de zoom',
    'settings.viewport.minZoom.description': 'Define o nível mínimo de zoom. Valores menores permitem reduzir mais o zoom para ver uma área maior da tela.',
    'settings.viewport.maxZoom.label': 'Nível máximo de zoom',
    'settings.viewport.maxZoom.description': 'Define o nível máximo de zoom. Valores maiores permitem aproximar mais para trabalhos detalhados.',
    'settings.viewport.boundaryLeft.label': 'Limite esquerdo da área de visualização',
    'settings.viewport.boundaryLeft.description': 'Limite esquerdo nas coordenadas do mundo. Define até onde a área de visualização pode se deslocar para a esquerda.',
    'settings.viewport.boundaryRight.label': 'Limite direito da área de visualização',
    'settings.viewport.boundaryRight.description': 'Limite direito nas coordenadas do mundo. Define até onde a área de visualização pode se deslocar para a direita.',
    'settings.viewport.boundaryTop.label': 'Limite superior da área de visualização',
    'settings.viewport.boundaryTop.description': 'Limite superior nas coordenadas do mundo. Define até onde a área de visualização pode se deslocar para cima.',
    'settings.viewport.boundaryBottom.label': 'Limite inferior da área de visualização',
    'settings.viewport.boundaryBottom.description': 'Limite inferior nas coordenadas do mundo. Define até onde a área de visualização pode se deslocar para baixo.',
    'settings.viewport.boundaryPlaceholder': 'Infinito',
    'settings.shortcuts.title': 'Atalhos de teclado',
    'settings.developer.title': 'Opções de desenvolvedor',
    'settings.developer.showViewportInfo.label': 'Mostrar informações da área de visualização',
    'settings.developer.showViewportInfo.description': 'Exibe informações de depuração da área de visualização, como posição, nível de zoom e limites.',
    'settings.developer.showObjectInfo.label': 'Mostrar informações dos objetos',
    'settings.developer.showObjectInfo.description': 'Exibe informações de depuração sobre os objetos na tela.',
    'settings.developer.showSyncProviderInfo.label': 'Mostrar informações do provedor de sincronização',
    'settings.developer.showSyncProviderInfo.description': 'Exibe informações de depuração sobre o estado da conexão do provedor de sincronização.',
    'settings.developer.showMigrationInfo.label': 'Mostrar informações de migração',
    'settings.developer.showMigrationInfo.description': 'Exibe informações de depuração sobre migrações de dados.',
    'settings.about.title': 'Sobre',
    'settings.about.description': 'Kritzel - Um aplicativo de desenho',

    // Export dialog
    'export.dialogTitle': 'Exportar',
    'export.tabs.viewport': 'Exportar área de visualização',
    'export.tabs.workspace': 'Exportar espaço de trabalho',
    'export.format.label': 'Formato',
    'export.filename.label': 'Nome do arquivo',
    'export.filename.placeholder': 'Digite o nome do arquivo',
    'export.exportButton': 'Exportar',

    // Workspace manager
    'workspace.sharedTooltip': 'Espaço de trabalho compartilhado',
    'workspace.rename': 'Renomear',
    'workspace.delete': 'Excluir',

    // Zoom panel
    'zoom.zoomIn': 'Aumentar zoom',
    'zoom.zoomOut': 'Diminuir zoom',

    // Utility panel
    'utility.undo': 'Desfazer',
    'utility.redo': 'Refazer',
    'utility.delete': 'Excluir itens selecionados',

    // Share dialog
    'share.dialogTitle': 'Compartilhar espaço de trabalho',
    'share.linkSharing.label': 'Compartilhamento por link',
    'share.linkSharing.enabledDescription': 'Qualquer pessoa com o link pode acessar este espaço de trabalho.',
    'share.linkSharing.disabledDescription': 'O compartilhamento por link está desativado. Somente você pode acessar este espaço de trabalho.',
    'share.linkSharing.toggleLabel': 'Ativar compartilhamento por link',
    'share.copyLink.title': 'Copiar link',
    'share.copyLink.copied': 'Copiado!',

    // Login dialog
    'login.dialogTitle': 'Entrar',

    // Current user dialog
    'currentUser.dialogTitle': 'Conta',

    // Back to content
    'backToContent.label': 'Voltar ao conteúdo',

    // Tool config
    'toolConfig.collapse': 'Recolher',
    'toolConfig.expand': 'Expandir',

    // More menu button
    'moreMenu.ariaLabel': 'Mais opções',

    // Editor
    'editor.loading': 'Carregando...',

    // Watermark
    'watermark.poweredBy': 'Desenvolvido por Kritzel',
  },
};
