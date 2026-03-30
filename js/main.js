// Substitua pelo ID real da sua planilha pública
const CSV_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSoIHyTjjZ4qS0y5Ekb8rQoXlQBBZPOOla_yJ-ABB0ljDYB1ZqscrRavPyK9VhK0N1saFSfn09cwsnZ/pub?output=csv`;

let allStudentsData = []; // Guarda todos os dados da planilha
let currentFilter = "todos"; // Lembra qual filtro está ativo no momento

// Mapeamento: Nome do Pokemon (Planilha Col B) -> Sprite Local (images/src/)
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
    // Adiciona um timestamp na URL para "enganar" o cache do navegador e pegar sempre a versão mais nova
    const cacheBusterUrl = `${CSV_URL}&t=${new Date().getTime()}`;
    const response = await fetch(cacheBusterUrl);
    const csvText = await response.text();

    // Salva na variável global os dados convertidos e ordenados
    allStudentsData = parseAndSortData(csvText);

    if (allStudentsData.length > 0) {
      atualizarDestaque(allStudentsData[0]); // Pega o TOP 1 (índice 0) e atualiza o banner

      // Aplica o filtro atual (assim a tabela não "pula" para 'Todos' quando atualiza no background)
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

// Transforma o texto CSV em dados manipuláveis
function parseAndSortData(csvText) {
  const lines = csvText.split("\n");
  const studentsData = [];

  // Ignora a linha 0 (cabeçalhos) e começa da 1
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const columns = lines[i].split(",");

    // A=0 (Nome), B=1 (Evolução), J=9 (Pontos), K=10 (Inicial)
    // Atualizado com os seus índices (10 e 11)
    let score = columns[10] ? parseInt(columns[10].trim()) : 0;
    if (isNaN(score)) score = 0;

    studentsData.push({
      nome: columns[0] ? columns[0].trim() : "-",
      pokemonAtualNome: columns[1] ? columns[1].trim() : "",
      pokemonInicial: columns[11] ? columns[11].trim() : "Desconhecido",
      pontuacaoTotal: score,
    });
  }

  // Ordena do maior pro menor (Decrescente)
  studentsData.sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);

  return studentsData;
}

// === NOVA FUNÇÃO: Atualiza o card de destaque ===
function atualizarDestaque(topStudent) {
  // Busca os elementos HTML que criamos lá em cima no index.html
  const destaqueImg = document.querySelector(".destaque-img");
  const destaqueTitulo = document.querySelector(".hardcoded-student h2");
  const destaquePontos = document.querySelector(".score");
  const destaqueContainer = document.querySelector(".hardcoded-student");

  // Descobre qual é a imagem correta
  const spriteKey = topStudent.pokemonAtualNome.toLowerCase();
  const spriteSrc = POKEMON_SPRITES[spriteKey + "mvp"] || ""; // Se não achar, fica vazio

  // Atualiza os dados na tela
  if (spriteSrc) destaqueImg.src = spriteSrc;
  destaqueImg.alt = topStudent.pokemonAtualNome;
  destaqueTitulo.textContent = `MVP: ${topStudent.nome} (${topStudent.pokemonAtualNome})`;
  destaquePontos.textContent = `${topStudent.pontuacaoTotal} pts`;

  // Bônus: Muda a cor da borda do card de destaque baseado no pokemon inicial do vencedor!
  const inicial = topStudent.pokemonInicial.toLowerCase();
  if (inicial.includes("charizard") || inicial.includes("charmander")) {
    destaqueContainer.style.borderColor = "#e53935"; // Vermelho
  } else if (inicial.includes("bulbasaur")) {
    destaqueContainer.style.borderColor = "#43a047"; // Verde
  } else if (inicial.includes("squirtle")) {
    destaqueContainer.style.borderColor = "#1e88e5"; // Azul
  } else {
    destaqueContainer.style.borderColor = "#ffd700"; // Dourado padrão
  }
}

// === NOVA FUNÇÃO: Filtra a tabela por Pokémon Inicial ===
function filterRanking(starter) {
  currentFilter = starter; // Salva o filtro atual na memória

  // 1. Remove a classe 'active' de todos os botões de filtro
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // 2. Adiciona a classe 'active' apenas no botão que foi clicado
  const activeBtn = document.getElementById(`btn-${starter}`);
  if (activeBtn) activeBtn.classList.add("active");

  // 3. Filtra a lista principal
  let listaFiltrada;
  if (starter === "todos") {
    listaFiltrada = allStudentsData;
  } else {
    // Ignora diferenças de maiúsculas/minúsculas para evitar bugs
    listaFiltrada = allStudentsData.filter((student) =>
      student.pokemonInicial.toLowerCase().includes(starter),
    );
  }

  // 4. Manda desenhar a tabela. Se o time estiver vazio, avisa.
  if (listaFiltrada.length === 0) {
    document.getElementById("table-body").innerHTML =
      `<tr><td colspan="4" style="text-align:center; padding: 20px;">Nenhum treinador deste time foi encontrado.</td></tr>`;
  } else {
    renderTableRows(listaFiltrada);
  }
}

// Desenha a tabela com os alunos passados (todos ou filtrados)
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

    // Tema de cor baseado no inicial
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

// 1. Inicializa tudo no momento que a página abre
fetchAndRenderRanking(true);

// 2. Loop de atualização em tempo real (Polling a cada 30 segundos)
setInterval(() => {
  console.log("Sincronizando dados com a planilha...");
  fetchAndRenderRanking(false);
}, 30000);
