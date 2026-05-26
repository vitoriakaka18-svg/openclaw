const fetch = require("node-fetch") || globalThis.fetch;
const url =
  "https://rljynorj.api.sanity.io/v2023-01-01/data/query/production?query=" +
  encodeURIComponent('*[_type=="product" && status!="vendida" && status!="reservada"]');
fetch(url)
  .then((r) => r.json())
  .then((j) => {
    const vestidos = j.result.filter((p) => {
      const isVestido =
        (p.name && p.name.toLowerCase().includes("vestido")) ||
        (p.subcategory && p.subcategory.toLowerCase() === "vestido");
      const isG = Array.isArray(p.size) ? p.size.includes("G") : p.size === "G";
      return isVestido && isG;
    });
    console.log(
      JSON.stringify(
        vestidos.map((v) => ({
          nome: v.name,
          preco: v.price,
          tamanho: v.size,
          status: v.status,
          img_ref: v.imagePrimary?.asset?._ref || v.imagePrimary?.asset?.url || null,
        })),
        null,
        2,
      ),
    );
  })
  .catch(console.error);
