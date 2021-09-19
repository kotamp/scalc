<script lang="ts">
  import Label from './Label.svelte'
  let screen = 0
  let width = 0
  let length = 0
  let area = 0

  $: area = (width || 0) * (length || 0) * 0.0001

  let priceSquare = 0
  let priceOne = 0

  $: {
    if (priceSquare === 0) {
      priceOne = -1
    } else {
      priceOne = (area || 0) * priceSquare
    }
  }

  let packArea = 0
  let packCount = 0
  $: {
    if (area === 0) {
      packCount = -1
    } else {
      packCount = packArea / area
    }
  }

  let queryCount = 0
  let queryPackCount = 0
  let queryResult = 0
  let queryResultRemainder = 0
  let queryResultCeil = 0
  let queryFull = 0
  // queryCount

  $: {
    console.log(queryPackCount)
    if (queryPackCount === 0 || queryPackCount == null || queryCount == null) {
      queryResult = -1
      queryResultRemainder = -1
      queryResultCeil = -1
      queryFull = -1
    } else {
      queryResultCeil = Math.ceil(queryCount/queryPackCount)
      queryResultRemainder = queryResultCeil * queryPackCount - queryCount
      queryResult = queryCount / queryPackCount
      queryFull = queryResultCeil * queryPackCount
    }
  }
</script>

<main>
  <nav
    ><button type="button" on:click={() => (screen = 0)}>Цена Плитки</button
    ><button type="button" on:click={() => (screen = 1)}>Кол-во Плиток</button
    ><button type="button" on:click={() => (screen = 2)}>Кол-во Упаковок</button
    ></nav
  >
  <section class="single-area" class:hidden={screen !== 0 && screen !== 1}>
    <Label label="Ширина (см)" bind:value={width} />
    <Label label="Длина (см)" bind:value={length} />
    <Label
      label="Площадь (кв. м)"
      bind:value={area}
      disabled
      error={screen === 1 && area === 0}
    />
  </section>
  <section class="calc-single-price" class:hidden={screen !== 0}>
    <Label label="Цена одного кв. м" bind:value={priceSquare} />
    <Label
      label="Цена Плитки"
      bind:value={priceOne}
      disabled
      error={priceOne === -1}
    />
  </section>
  <section class="calc-pack-count" class:hidden={screen !== 1}>
    <Label label="Упаковка (кв. м)" bind:value={packArea} />
    <Label
      label="Упаковка (шт)"
      bind:value={packCount}
      disabled
      error={packCount === -1}
    />
  </section>
  <section class="calc-cart" class:hidden={screen !== 2}>
    <Label label="Надо плиток (шт)" bind:value={queryCount} />
    <Label label="Плиток в упаковке (шт)" bind:value={queryPackCount} />
    <Label
      label="Кол-во упаковок"
      bind:value={queryResult}
      disabled
      error={queryResult === -1}
    />
    <Label
      label="Кол-во лишних плиток (шт)"
      bind:value={queryResultRemainder}
      disabled
      error={queryResultRemainder === -1}
    />
    <Label
      label="Кол-во целых упаковок (шт)"
      bind:value={queryResultCeil}
      disabled
      error={queryResultCeil === -1}
    />
    <Label
      label="Кол-во плиток (шт)"
      bind:value={queryFull}
      disabled
      error={queryResultCeil === -1}
    />
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

  section > * {
    margin-bottom: 10px;
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
</style>
