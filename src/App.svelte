<script lang="ts">
  import Label from './Label.svelte'
  import Area from './sections/Area.svelte'
  import AreaToPrice from './sections/AreaToPrice.svelte'
  import AreaToPackage from './sections/AreaToPackage.svelte'
  import CountToPackage from './sections/CountToPackage.svelte'
  let screen = 0

  let singleArea = null
  let singlePrice = null

  let packArea = 0
  let packCount = 0
</script>

<main>
  <nav class="row">
    <button
      class="cell"
      class:selected={screen === 0}
      type="button"
      on:click={() => (screen = 0)}>Цена Плитки</button
    ><button
      class="cell"
      class:selected={screen === 1}
      type="button"
      on:click={() => (screen = 1)}>Кол-во Плиток</button
    ><button
      class="cell"
      class:selected={screen === 2}
      type="button"
      on:click={() => (screen = 2)}>Кол-во Упаковок</button
    ></nav
  >
  <section class="single-area" class:hidden={screen !== 0 && screen !== 1}>
    <Area bind:singleArea mustNotZero={screen === 1} />
  </section>
  <section class="calc-single-price" class:hidden={screen !== 0}>
    <AreaToPrice bind:singleArea />
  </section>
  <section class="calc-pack-count" class:hidden={screen !== 1}>
    <AreaToPackage bind:singleArea />
  </section>
  <section class="calc-cart" class:hidden={screen !== 2}>
    <CountToPackage />
  </section>
</main>

<style>
  .hidden {
    display: none;
  }

  nav {
    display: flex;
  }
  nav > * {
    flex: 1 0 0;
  }

  section {
    margin-bottom: 0px;
  }

  main {
    /* text-align: center; */
    padding: 1em;
    /* max-width: 240px; */
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
  .selected {
    border-color: #ff3e00;
  }
</style>
