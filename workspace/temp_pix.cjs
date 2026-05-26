const { execSync } = require("child_process");
const json = JSON.stringify({
  nome: "Kailany Vitoria Pereira",
  email: "cliente@email.com",
  total: 79.0,
});
const cmd = `node c:\\Users\\Kaila\\.gemini\\antigravity\\scratch\\achado_de_luxo\\openclaw-nina\\workspace\\skills\\gerarPix\\gerarPix.js '${json}'`;
try {
  console.log(execSync(cmd).toString());
} catch (e) {
  console.error(e.stderr?.toString() || e.message);
}
