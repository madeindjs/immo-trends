<template>
  <div class="navbar bg-base-100 shadow-sm shrink-0">
    <div class="navbar-start">
      <details class="dropdown lg:hidden">
        <summary
          class="btn btn-ghost"
          aria-label="Ouvrir le menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </summary>
        <ul
          class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1100] mt-3 w-52 p-2 shadow"
        >
          <li>
            <NuxtLink to="/" :class="{ 'menu-active': isHome }">
              Carte
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/about" :class="{ 'menu-active': isAbout }">
              À propos
            </NuxtLink>
          </li>
        </ul>
      </details>
      <NuxtLink to="/" class="btn btn-ghost text-xl">
        immo-trends
      </NuxtLink>
    </div>
    <div class="navbar-center hidden lg:flex">
      <ul class="menu menu-horizontal px-1">
        <li>
          <NuxtLink to="/" :class="{ 'menu-active': isHome }">
            Carte
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/about" :class="{ 'menu-active': isAbout }">
            À propos
          </NuxtLink>
        </li>
      </ul>
    </div>
    <div class="navbar-end" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const isHome = computed(() => route.path === "/");
const isAbout = computed(() => route.path === "/about");
</script>