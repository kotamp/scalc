<script lang="ts">
  import Header from './sections/Header.svelte'

  import CellPrice from './sections/pages/CellPrice.svelte'
  import CellCount from './sections/pages/CellCount.svelte'
  import AreaPrice from './sections/pages/AreaPrice.svelte'
  import PackCount from './sections/pages/PackCount.svelte'

  const screenKeys = ['cellPrice', 'cellCount', 'areaPrice', 'packCount']

  const screenNames = [
    '1. Цена плитки',
    '2. Кол-во плиток',
    '3. Цена площади',
    '4. Кол-во упаковок',
  ]

  let currentScreen = screenKeys[0]
</script>

<main>
  <Header keys={screenKeys} names={screenNames} bind:current={currentScreen} />
  <hr />

  <section class:hidden={'cellPrice' !== currentScreen}>
    <CellPrice />
  </section>
  <section class:hidden={'cellCount' !== currentScreen}>
    <CellCount />
  </section>
  <section class:hidden={'areaPrice' !== currentScreen}>
    <AreaPrice />
  </section>
  <section class:hidden={'packCount' !== currentScreen}>
    <PackCount />
  </section>
</main>

<style>
  .hidden {
    display: none;
  }

  section {
    margin-bottom: 0px;
    padding: 1em;
  }

  main {
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }

  hr {
    border: none;
    border-top: 1px solid #ccc8;
  }
</style>
