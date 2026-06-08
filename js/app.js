const API_BASE = "https://pokeapi.co/api/v2/pokemon/";

const form = document.getElementById("searchForm");
const queryEl = document.getElementById("query");
const searchBtn = document.getElementById("searchBtn");

const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

const template = document.getElementById("pokemonCardTemplate");

const chipButtons = document.querySelectorAll(".chip");

init();

/* ===================================== */
/* INIT */
/* ===================================== */

function init() {

  form.addEventListener("submit", onSubmit);

  chipButtons.forEach((chip) => {

    chip.addEventListener("click", () => {

      const pokemon = chip.dataset.pokemon;

      queryEl.value = pokemon;

      executeSearch(pokemon);

    });

  });

}

/* ===================================== */
/* SUBMIT */
/* ===================================== */

async function onSubmit(event) {

  event.preventDefault();

  const query = queryEl.value.trim().toLowerCase();

  if (!query) {

    setStatus("Escribe un nombre o ID.", "error");

    return;
  }

  await executeSearch(query);

}

/* ===================================== */
/* BÚSQUEDA */
/* ===================================== */

async function executeSearch(query) {

  setLoading(true);

  clearResults();

  setStatus(`Buscando Pokémon "${query}"...`, "loading");

  try {

    const pokemon = await fetchPokemon(query);

    renderPokemon(pokemon);

    setStatus("Pokémon encontrado correctamente.", "success");

  } catch (error) {

    setStatus(error.message, "error");

    resultsEl.innerHTML = `
      <div class="empty-state">
        No se encontró ningún Pokémon.
      </div>
    `;

  } finally {

    setLoading(false);

  }

}

/* ===================================== */
/* FETCH POKÉMON */
/* ===================================== */

async function fetchPokemon(query) {

  const response = await fetch(`${API_BASE}${query}`);

  if (!response.ok) {

    throw new Error("Pokémon no encontrado.");

  }

  const data = await response.json();

  /* Obtener evolución */

  const speciesResponse = await fetch(data.species.url);
  const speciesData = await speciesResponse.json();

  const evolutionResponse = await fetch(speciesData.evolution_chain.url);
  const evolutionData = await evolutionResponse.json();

  data.evolutions = extractEvolutions(evolutionData.chain);

  return data;

}

/* ===================================== */
/* EXTRAER EVOLUCIONES */
/* ===================================== */

function extractEvolutions(chain) {

  const evolutions = [];

  function traverse(node) {

    evolutions.push(node.species.name);

    node.evolves_to.forEach((evolution) => {
      traverse(evolution);
    });

  }

  traverse(chain);

  return evolutions;

}

/* ===================================== */
/* RENDER */
/* ===================================== */

function renderPokemon(pokemon) {

  const clone = template.content.cloneNode(true);

  /* ========================= */
  /* IMAGEN */
  /* ========================= */

  const image = clone.querySelector(".pokemon-image");

  image.src =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default;

  image.alt = pokemon.name;

  /* ========================= */
  /* NOMBRE */
  /* ========================= */

  const nameEl = clone.querySelector(".pokemon-name");

  nameEl.textContent = capitalize(pokemon.name);

  /* ========================= */
  /* ID */
  /* ========================= */

  const idEl = clone.querySelector(".pokemon-id");

  idEl.textContent = `#${pokemon.id}`;

  /* ========================= */
  /* TIPOS */
  /* ========================= */

  const typesContainer = clone.querySelector(".pokemon-types");

  pokemon.types.forEach((typeInfo) => {

    const badge = document.createElement("span");

    const typeName = typeInfo.type.name;

    badge.className = "type-badge";

    badge.textContent = capitalize(typeName);

    badge.style.background = getTypeColor(typeName);

    typesContainer.appendChild(badge);

  });

  /* ========================= */
  /* HABILIDADES */
  /* ========================= */

  const abilitiesList = clone.querySelector(".pokemon-abilities");

  pokemon.abilities.forEach((abilityInfo) => {

    const li = document.createElement("li");

    li.textContent = abilityInfo.ability.name.replace("-", " ");

    abilitiesList.appendChild(li);

  });

  /* ========================= */
  /* ESTADÍSTICAS */
  /* ========================= */

  const statsList = clone.querySelector(".pokemon-stats");

  pokemon.stats.forEach((statInfo) => {

    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${capitalize(statInfo.stat.name)}:</strong>
      ${statInfo.base_stat}
    `;

    statsList.appendChild(li);

  });

  /* ========================= */
  /* MOVIMIENTOS */
  /* ========================= */

  const movesList = clone.querySelector(".pokemon-moves");

  pokemon.moves
    .slice(0, 10)
    .forEach((moveInfo) => {

      const li = document.createElement("li");

      li.textContent = moveInfo.move.name.replace("-", " ");

      movesList.appendChild(li);

    });

/* ========================= */
/* EVOLUCIONES */
/* ========================= */

const evolutionContainer = clone.querySelector(".pokemon-evolutions");

pokemon.evolutions.forEach((evo) => {

  const button = document.createElement("button");

  button.className = "evolution-badge";

  button.textContent = capitalize(evo);

  button.type = "button";

  /* Al pulsar busca automáticamente */

  button.addEventListener("click", () => {

    queryEl.value = evo;

    executeSearch(evo);

    /* Scroll suave hacia arriba */

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

  evolutionContainer.appendChild(button);

});

  /* ========================= */
  /* MOSTRAR */
  /* ========================= */

  resultsEl.appendChild(clone);

}

/* ===================================== */
/* COLORES TIPOS */
/* ===================================== */

function getTypeColor(type) {

  const colors = {

    fire: "#ef4444",
    water: "#3b82f6",
    grass: "#22c55e",
    electric: "#facc15",
    psychic: "#ec4899",
    ice: "#67e8f9",
    dragon: "#7c3aed",
    dark: "#374151",
    fairy: "#f9a8d4",
    normal: "#9ca3af",
    fighting: "#b91c1c",
    flying: "#60a5fa",
    poison: "#a855f7",
    ground: "#ca8a04",
    rock: "#78716c",
    bug: "#84cc16",
    ghost: "#6366f1",
    steel: "#94a3b8"

  };

  return colors[type] || "#64748b";

}

/* ===================================== */
/* UTILIDADES */
/* ===================================== */

function capitalize(text) {

  return text.charAt(0).toUpperCase() + text.slice(1);

}

function setStatus(message, type = "") {

  statusEl.className = "status";

  if (type) {

    statusEl.classList.add(`is-${type}`);

  }

  statusEl.textContent = message;

}

function setLoading(isLoading) {

  searchBtn.disabled = isLoading;

  searchBtn.textContent = isLoading
    ? "Buscando..."
    : "Buscar";

}

function clearResults() {

  resultsEl.innerHTML = "";

}