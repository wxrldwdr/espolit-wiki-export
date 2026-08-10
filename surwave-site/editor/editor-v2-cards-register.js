(() => {
  const Core = window.SurwaveEditorCoreV2;
  if (!Core) return;

  if (!Core.TYPES.some(([type]) => type === 'servercards')) {
    const before = Core.TYPES.findIndex(([type]) => type === 'quote');
    Core.TYPES.splice(before >= 0 ? before : Core.TYPES.length, 0, ['servercards', 'IP-карточки / копирование']);
  }

  if (!window.__SurwaveServerCardsDefaultRegistered) {
    const previousDefault = Core.defaultBlock;
    Core.defaultBlock = type => {
      if (type !== 'servercards') return previousDefault(type);
      return {
        type: 'servercards',
        borderGradient: true,
        textGradient: true,
        borderEdge: '#00ff78',
        borderCenter: '#00ffc0',
        textEdge: '#00ff78',
        textCenter: '#00ffc0',
        items: [
          {ip:'mc.surwave.ru', title:'mc.surwave.ru', image:''},
          {ip:'mc.surwave.pro', title:'mc.surwave.pro', image:''}
        ]
      };
    };
    window.__SurwaveServerCardsDefaultRegistered = true;
  }

  window.SurwaveServerCardsRegistrationLoaded = true;
})();
