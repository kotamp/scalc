<script lang="ts">
  import { slide } from 'svelte/transition'
  export let keys: string[]
  export let names: string[]
  export let current: string

  let menuHidden = true
</script>

<header>
  <div class="container">
    <div class="column-text">
      {names[keys.indexOf(current)]}
    </div><div class="column-button">
      <button class="menu-button" on:click={() => (menuHidden = !menuHidden)}
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="feather feather-list"
          ><line x1="8" y1="6" x2="21" y2="6" /><line
            x1="8"
            y1="12"
            x2="21"
            y2="12"
          /><line x1="8" y1="18" x2="21" y2="18" /><line
            x1="3"
            y1="6"
            x2="3.01"
            y2="6"
          /><line x1="3" y1="12" x2="3.01" y2="12" /><line
            x1="3"
            y1="18"
            x2="3.01"
            y2="18"
          /></svg
        ></button
      ></div
    >
  </div>
  {#if !menuHidden}
    <div
      class="list"
      transition:slide={{
        duration: 400,
      }}
    >
      <nav>
        {#each keys as key, i}
          <button
            class:selected={key === current}
            type="button"
            on:click={() => {
              current = key
            }}>{names[i]}</button
          >
        {/each}
      </nav></div
    >{/if}
</header>

<style>
  header {
    margin: 16px;
  }
  .container {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  .menu-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 64px;
    height: 64px;
    padding: 0;
    margin: 0;
  }
  .column-text {
    flex: 1 0 auto;
    font-size: 24px;
  }

  nav {
    display: flex;
    flex-direction: column;
    background-color: #fff;
  }
  .selected {
    border-color: #ff3e00;
  }
</style>
