const { execFileSync } = require("child_process");
const json = JSON.stringify({
  nome: "Kailany Vitoria Pereira",
  email: "cliente@email.com",
  total: 79.0,
});
try {
  const out = execFileSync("node", [
    "c:\\Users\\Kaila\\.gemini\\antigravity\\scratch\\achado_de_luxo\\openclaw-nina\\workspace\\skills\\gerarPix\\gerarPix.js",
    json,
  ]);
  console.log(out.toString());
} catch (e) {
  console.error(e.stderr?.toString() || e.message);
}
