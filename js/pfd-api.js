export async function loadPFDData() {
  const res = await fetch("js/pfd-data.json");
  return await res.json();
}
