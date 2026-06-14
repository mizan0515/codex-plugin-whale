const api = globalThis.whale ?? globalThis.chrome;

api?.runtime?.onInstalled?.addListener(async () => {
  await api.storage?.local?.set?.({
    installedAt: new Date().toISOString(),
    sidebarOpens: 0,
  });
});

api?.sidebarAction?.onClicked?.addListener(async (result) => {
  const current = await api.storage.local.get({ sidebarOpens: 0 });
  const sidebarOpens = Number(current.sidebarOpens ?? 0) + 1;
  await api.storage.local.set({ sidebarOpens, lastSidebarState: result });
  api.sidebarAction.setBadgeText({ text: String(sidebarOpens) });
  api.sidebarAction.setBadgeBackgroundColor({ color: "#05C3DD" });
});

