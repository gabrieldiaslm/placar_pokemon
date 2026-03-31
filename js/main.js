const CSV_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSoIHyTjjZ4qS0y5Ekb8rQoXlQBBZPOOla_yJ-ABB0ljDYB1ZqscrRavPyK9VhK0N1saFSfn09cwsnZ/pub?output=csv`;

let allStudentsData = [];
let currentFilter = "todos";

const POKEMON_SPRITES = {
  blastoise: "./src/blastoise.png",
  bulbasaur: "./src/bulbasaur.png",
  charizard: "./src/charizard.png",
  charmander: "./src/charmander.png",
  charmeleon: "./src/charmeleon.png",
  ivysaur: "./src/ivysaur.png",
  squirtle: "./src/squirtle.png",
  venusaur: "./src/venusaur.png",
  wartortle: "./src/wartortle.png",

  blastoisemvp: "./src/blastoise.gif",
  bulbasaurmvp: "./src/bulbasaur.gif",
  charizardmvp: "./src/charizard.gif",
};

// Função principal que busca e organiza tudo
async function fetchAndRenderRanking(isFirstLoad = false) {
  const tableBody = document.getElementById("table-body");

  if (isFirstLoad) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Analisando Pokédex...</td></tr>`;
  }

  try {
    // Atualização forçada dos dados
    const cacheBusterUrl = `${CSV_URL}&t=${new Date().getTime()}`;
    const response = await fetch(cacheBusterUrl);
    const csvText = await response.text();

    allStudentsData = parseAndSortData(csvText);

    if (allStudentsData.length > 0) {
      atualizarDestaque(allStudentsData[0]); // Pega o aluno TOP 1 

      filterRanking(currentFilter);
    } else {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum dado encontrado.</td></tr>`;
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    if (isFirstLoad) {
      tableBody.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">Erro fatal ao carregar os dados. Verifique a planilha.</td></tr>`;
    }
  }
}

// Manipular CSV
function parseAndSortData(csvText) {
  const lines = csvText.split("\n");
  const studentsData = [];

  // Ignora o cabeçalho
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const columns = lines[i].split(",");

    // A=0 (Nome), B=1 (Evolução), K=10 (Pontos), L=11 (Inicial)
    let score = columns[10] ? parseInt(columns[10].trim()) : 0;
    if (isNaN(score)) score = 0;

    studentsData.push({
      nome: columns[0] ? columns[0].trim() : "-",
      pokemonAtualNome: columns[1] ? columns[1].trim() : "",
      pokemonInicial: columns[11] ? columns[11].trim() : "Desconhecido",
      pontuacaoTotal: score,
    });
  }

  studentsData.sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

  return studentsData;
}

function atualizarDestaque(topStudent) {
  const destaqueImg = document.querySelector(".destaque-img");
  const destaqueTitulo = document.querySelector(".hardcoded-student h2");
  const destaquePontos = document.querySelector(".score");
  const destaqueContainer = document.querySelector(".hardcoded-student");

  const spriteKey = topStudent.pokemonAtualNome.toLowerCase();
  const spriteSrc = POKEMON_SPRITES[spriteKey + "mvp"] || "";

  if (spriteSrc) destaqueImg.src = spriteSrc;
  destaqueImg.alt = topStudent.pokemonAtualNome;
  destaqueTitulo.textContent = `MVP: ${topStudent.nome} (${topStudent.pokemonAtualNome})`;
  destaquePontos.textContent = `${topStudent.pontuacaoTotal} pts`;

  const inicial = topStudent.pokemonInicial.toLowerCase();
  if (inicial.includes("charizard") || inicial.includes("charmander")) {
    destaqueContainer.style.borderColor = "#e53935"; 
  } else if (inicial.includes("bulbasaur")) {
    destaqueContainer.style.borderColor = "#43a047";
  } else if (inicial.includes("squirtle")) {
    destaqueContainer.style.borderColor = "#1e88e5"; 
  } else {
    destaqueContainer.style.borderColor = "#ffd700"; 
  }
}

// Filtros
function filterRanking(starter) {
  currentFilter = starter; 

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeBtn = document.getElementById(`btn-${starter}`);
  if (activeBtn) activeBtn.classList.add("active");

  let listaFiltrada;
  if (starter === "todos") {
    listaFiltrada = allStudentsData;
  } else {
    listaFiltrada = allStudentsData.filter((student) =>
      student.pokemonInicial.toLowerCase().includes(starter),
    );
  }

  if (listaFiltrada.length === 0) {
    document.getElementById("table-body").innerHTML =
      `<tr><td colspan="4" style="text-align:center; padding: 20px;">Nenhum treinador deste time foi encontrado.</td></tr>`;
  } else {
    renderTableRows(listaFiltrada);
  }
}

// A tabela
function renderTableRows(data) {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = "";

  data.forEach((student) => {
    const tr = document.createElement("tr");

    const spriteKey = student.pokemonAtualNome.toLowerCase();
    const spriteSrc = POKEMON_SPRITES[spriteKey] || "";

    const spriteHtml = spriteSrc
      ? `<img src="${spriteSrc}" alt="${student.pokemonAtualNome}" class="pokemon-sprite">`
      : '<span style="font-size:0.8rem; color:#999;">Sem Imagem</span>';

    const themeClass = `theme-${student.pokemonInicial.toLowerCase()}`;
    tr.classList.add(themeClass);

    tr.innerHTML = `
            <td><strong>${student.nome}</strong></td>
            <td>${spriteHtml}</td>
            <td>${student.pokemonInicial}</td>
            <td>${student.pontuacaoTotal} pts</td>
        `;
    tableBody.appendChild(tr);
  });
}

fetchAndRenderRanking(true);

// tentativa de atualização automática a cada 30 segundos
setInterval(() => {
  console.log("Sincronizando dados com a planilha...");
  fetchAndRenderRanking(false);
}, 30000);
