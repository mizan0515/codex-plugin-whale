const api = globalThis.whale ?? globalThis.chrome;

document.getElementById("namespace").textContent = globalThis.whale ? "whale.*" : globalThis.chrome ? "chrome.*" : "없음";

api?.storage?.local?.get?.({ sidebarOpens: 0 }).then((value) => {
  document.getElementById("opens").textContent = String(value.sidebarOpens ?? 0);
  document.getElementById("status").textContent = "사이드바 API 로드됨";
});

document.getElementById("open-mobile").addEventListener("click", () => {
  window.open("https://m.naver.com/", "_blank", "whale-mobile");
});

document.getElementById("open-space").addEventListener("click", () => {
  window.open("https://shopping.naver.com/", "_blank", "whale-space");
});
