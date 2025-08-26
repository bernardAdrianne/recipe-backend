<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';

  interface Recipe {
    id: string;
    title?: string;
    image: string;
    ingredients: string[];
    steps?: string[];
    category?: string;
    saved: boolean;
  }

  let showModal = false;
  let selectedRecipe: Recipe | null = null;
  let isLoading = false;
  let searchTerm = '';
  let recipes: Recipe[] = [];
  let selectedCategory = 'All';
  let currentPage = 1;
  const itemsPerPage = 9;

  // NEW: modal for ingredient search
  let showSearchModal = false;
  let ingredientsInput = "";
  let hasSearched = false;

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert'];
  
  let unsubscribe: () => void;

  onMount(() => {
    fetchRecipes();
    window.addEventListener("keydown", handleKeydown);
    unsubscribe = page.subscribe(($page) => {
      searchTerm = $page.url.searchParams.get('search')?.toLowerCase() || '';
      fetchRecipes();
    });
  });

  onDestroy(() => {
    unsubscribe?.();
    window.removeEventListener("keydown", handleKeydown);
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      if (showModal) closeModal();
      if (showSearchModal) closeSearchModal();
    }
  }

  async function toggleSave(id: string, saved: boolean) {
    try {
      const url = saved
        ? 'http://localhost:3000/api/unsave'
        : 'http://localhost:3000/api/save';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipeId: id })
      });

      if (res.ok) {
        recipes = recipes.map(r =>
          r.id === id ? { ...r, saved: !saved } : r
        );
        if (selectedRecipe && selectedRecipe.id === id) {
          selectedRecipe = { ...selectedRecipe, saved: !saved };
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchRecipes() {
    isLoading = true;
    try {
      const allRes = await fetch('http://localhost:3000/api/recipe/all', { credentials: 'include' });
      const allData = await allRes.json();
      let list = allData.results || allData.recipes || [];

      const savedRes = await fetch('http://localhost:3000/api/saved/', { credentials: 'include' });
      const savedData = await savedRes.json();
      const savedIds = (savedData.results || []).map((r: any) => r._id.toString());

      recipes = list.map((r: any) => ({
        id: r._id.toString(),
        title: r.title,
        image: r.image,
        ingredients: r.ingredients || [],
        category: r.category,
        steps: r.steps || [],
        saved: savedIds.includes(r._id.toString()),
      }));
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
      recipes = [];
    } finally {
      isLoading = false;
    }
  }

  async function fetchRecipeById(id: string) {
    try {
      const res = await fetch(`http://localhost:3000/api/recipe/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch recipe');
      const data = await res.json();
      return data.results;
    } catch (err) {
      console.error('Failed to fetch recipe: ', err);
    }
  }

  async function openRecipeModal(id: string) {
    const recipe = await fetchRecipeById(id);
    if (recipe) {
      selectedRecipe = recipe;
      showModal = true;
    }
  }

  function closeModal() {
    showModal = false;
    selectedRecipe = null;
  }

  function openSearchModal() {
    showSearchModal = true;
  }

  function closeSearchModal() {
    showSearchModal = false;
    ingredientsInput = "";
  }

  async function handleIngredientSearch() {
  hasSearched = true;
  showSearchModal = false;
  isLoading = true;
  currentPage = 1;

  try {
    const res = await fetch(
      `http://localhost:3000/api/recipe/search?ingredient=${encodeURIComponent(ingredientsInput)}`,
      { credentials: 'include' }
    );

    if (!res.ok) {
      const errData = await res.json();
      console.error("AI search error:", errData);
      recipes = [];
      return;
    }

    const data = await res.json();
    const list = data.results || [];

    // Mark saved recipes
    const savedRes = await fetch('http://localhost:3000/api/saved/', { credentials: 'include' });
    const savedData = await savedRes.json();
    const savedIds = (savedData.results || []).map((r: any) => r._id.toString());

    recipes = list.map((r: any) => ({
      id: r._id?.toString() || r.id,
      title: r.title,
      image: r.image,
      ingredients: r.ingredients || [],
      category: r.category,
      steps: r.steps || [],
      saved: savedIds.includes(r._id?.toString() || r.id),
    }));
  } catch (err) {
    console.error("Failed to fetch AI search recipes:", err);
    recipes = [];
  } finally {
    isLoading = false;
    ingredientsInput = "";
  }
}


  // Filtering
  const recentCount = 3;
  $: recentRecipes = recipes.slice(-recentCount);

  $: allFilteredRecipes = recipes.filter(recipe => {
    const matchesCategory =
      selectedCategory === 'All' ||
      (selectedCategory === 'Recent Searches' && recentRecipes.includes(recipe)) ||
      recipe.category === selectedCategory;

    const matchesSearch =
      !searchTerm ||
      recipe.title?.toLowerCase().includes(searchTerm) ||
      recipe.ingredients.some(i => i.toLowerCase().includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  $: totalPages = Math.ceil(allFilteredRecipes.length / itemsPerPage);
  $: paginatedRecipes = allFilteredRecipes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function goToNextPage() {
    if (currentPage < totalPages) currentPage++;
  }
  function goToPrevPage() {
    if (currentPage > 1) currentPage--;
  }
</script>

<section class="max-w-7xl mx-auto px-4 py-8">

  <!-- Search Button -->
  <div class="flex justify-center mb-6">
    <button
      class="px-6 py-2 bg-[#228B22] text-white rounded-full shadow hover:bg-[#1a5f17] transition"
      on:click={openSearchModal}
    >
      🔍 Search by Ingredients
    </button>
  </div>

  <!-- Ingredient Search Modal -->
  {#if showSearchModal}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fadeIn relative">
        <button
          class="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition"
          on:click={closeSearchModal}
        >
          ✖
        </button>
        <h2 class="text-xl font-bold text-gray-800 mb-4">Search Recipes by Ingredients</h2>
        <p class="text-sm text-gray-600 mb-3">Enter the ingredients you have (comma separated):</p>
        <input
          type="text"
          bind:value={ingredientsInput}
          placeholder="e.g. chicken, garlic, onion"
          class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#228B22] mb-4"
        />
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            on:click={closeSearchModal}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#1a5f17] transition"
            on:click={handleIngredientSearch}
            disabled={!ingredientsInput.trim()}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  {#if isLoading}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {#each Array(6) as _}
      <div class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
        <div class="bg-gray-300 h-48 w-full"></div>
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-300 rounded w-3/4"></div>
          <div class="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    {/each}
  </div>
  {:else if !hasSearched}
    <div class="text-center text-gray-500 my-12 text-lg font-medium">
      Start searching by clicking the <strong>Search by Ingredients</strong> button above.
    </div>
  {:else if paginatedRecipes.length === 0}
    <div class="text-center text-red-600 my-12 text-lg font-medium">
       No recipes match your ingredients.
    </div>
  {:else}
    <!-- Recipe Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {#each paginatedRecipes as recipe}
        <div class="bg-white rounded-lg shadow-md overflow-hidden transition hover:shadow-lg">
          <div class="cursor-pointer" on:click={() => openRecipeModal(recipe.id)}>
            <img src={recipe.image} alt={recipe.title} class="w-full h-48 object-cover"/>
            <h2 class="text-lg font-semibold text-gray-800 p-4">
              {recipe.title}
            </h2>
          </div>

          <div class="px-4 pb-4 flex justify-between items-center">
            {#if recipe.category}
              <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{recipe.category}</span>
            {/if}
            <button
              type="button"
              class={`text-sm px-3 py-1 rounded transition 
                ${recipe.saved 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-[#228B22] text-white hover:bg-[#1a5f17]'}`}
              on:click|stopPropagation={() => toggleSave(recipe.id, recipe.saved)}
            >
              {recipe.saved ? 'Unsave' : 'Save'}
            </button>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex justify-center mt-8 gap-4">
        <button
          on:click={goToPrevPage}
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition disabled:opacity-50"
          disabled={currentPage === 1}
        >
          ← Back
        </button>
        <span class="text-gray-700 font-medium">Page {currentPage} of {totalPages}</span>
        <button
          on:click={goToNextPage}
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition disabled:opacity-50"
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    {/if}
  {/if}

  <!-- Recipe Details Modal -->
  {#if showModal && selectedRecipe}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" on:click={closeModal}>
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-fadeIn relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-title"
        on:click|stopPropagation
      >
        <!-- Image + Title -->
        <div class="relative">
          <img src={selectedRecipe.image} alt={selectedRecipe.title} class="w-full h-64 object-cover"/>
          <button
            type="button"
            class="absolute top-3 right-3 z-10 flex items-center justify-center 
                   w-9 h-9 rounded-full bg-white/80 text-gray-700 
                   shadow-md hover:bg-red-500 hover:text-white 
                   transition-all duration-200 ease-in-out 
                   hover:scale-110 active:scale-95"
            on:click={closeModal}
            aria-label="Close modal"
          >
            ✖
          </button>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h2 id="recipe-title" class="text-2xl font-bold text-white drop-shadow-md">{selectedRecipe.title}</h2>
          </div>
        </div>

        <!-- Details -->
        <div class="p-6 max-h-[65vh] overflow-y-auto">
          {#if selectedRecipe.category}
            <p class="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-4">{selectedRecipe.category}</p>
          {/if}

          <h3 class="text-lg font-semibold text-gray-800 mb-2">Ingredients</h3>
          <ul class="list-disc list-inside text-gray-700 mb-6 space-y-1">
            {#each selectedRecipe.ingredients as ing}
              <li>{ing}</li>
            {/each}
          </ul>

          {#if selectedRecipe.steps && selectedRecipe.steps.length > 0}
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Steps</h3>
            <p class="text-gray-700 whitespace-pre-line leading-relaxed mb-6">
              {selectedRecipe.steps.join('\n\n')}
            </p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.25s ease-out;
  }
</style>
