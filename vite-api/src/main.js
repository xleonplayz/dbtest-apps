// The frontend: reads and adds notes through the API beside it.
async function refresh() {
  const body = await (await fetch("/api/notes")).json();
  document.getElementById("count").textContent = `${body.count ?? "?"} notes`;
  document.getElementById("last").innerHTML = (body.last ?? []).map((n) => `<li>${n.id}: ${n.text}</li>`).join("");
}
document.getElementById("add").addEventListener("click", async () => {
  await fetch("/api/notes?text=from-the-browser", { method: "POST" });
  await refresh();
});
refresh();
