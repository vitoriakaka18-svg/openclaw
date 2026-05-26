const projectId = (process.env.SANITY_PROJECT_ID || "rljynorj").trim();
const dataset = (process.env.SANITY_DATASET || "production").trim();
const token = (process.env.SANITY_TOKEN || "").trim();

const termo = process.argv[2] || "";

// Monta a query GROQ filtrando por status e termo de busca
let query = `*[_type == "product" && status in ["disponivel", "ultima", "promocao"]`;
if (termo) {
  query += ` && (
    name match "*${termo}*" ||
    brand match "*${termo}*" ||
    category match "*${termo}*" ||
    subcategory match "*${termo}*" ||
    condition match "*${termo}*" ||
    (size == "${termo}") ||
    (count((size)[@ == "${termo}"]) > 0)
  )`;
}
query += `] | order(_updatedAt desc) {
  _id,
  "nome": name,
  "preco": price,
  "precoOriginal": originalPrice,
  "tamanho": size,
  "marca": brand,
  "categoria": category,
  "subcategoria": subcategory,
  "condicao": condition,
  "detalhes": details,
  "cor": color,
  "cores": colors[]->nome,
  "status": status,
  "imagemUrl": "https://cdn.sanity.io/images/${projectId}/${dataset}/" + imagePrimary.asset->_id + "-" + string(imagePrimary.asset->metadata.dimensions.width) + "x" + string(imagePrimary.asset->metadata.dimensions.height) + "." + imagePrimary.asset->extension,
  "imagemUrlAlt": "https://cdn.sanity.io/images/${projectId}/${dataset}/" + imageSecondary.asset->_id + "-" + string(imageSecondary.asset->metadata.dimensions.width) + "x" + string(imageSecondary.asset->metadata.dimensions.height) + "." + imageSecondary.asset->extension
}[0...30]`;

const url = `https://${projectId}.api.sanity.io/v2023-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`;

async function buscar() {
  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json();
      console.error("Erro Sanity:", JSON.stringify(err));
      process.exit(1);
    }
    const json = await res.json();
    const resultados = json.result || [];
    if (resultados.length === 0) {
      console.log(JSON.stringify({ mensagem: "Nenhuma peça encontrada com esse critério." }));
    } else {
      console.log(JSON.stringify(resultados, null, 2));
    }
  } catch (err) {
    console.error("Erro na busca do catálogo:", err.message);
    process.exit(1);
  }
}

buscar();
