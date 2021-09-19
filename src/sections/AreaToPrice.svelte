<script lang="ts">
  import { round } from '../round'
  import Label from '../Label.svelte'

  export let singleArea = null
  let squarePrice = null
  let count = 1

  let resultPrice = null
  let resultArea = null

  $: {
    if (squarePrice == null || singleArea == null || count === null) {
      resultPrice = null
      resultArea = null
    } else {
      let singlePrice = squarePrice * singleArea
      resultPrice = round(singlePrice * count)
      resultArea = round(singleArea * count)
    }
  }
</script>

<div class="row">
  <div class="cell">
    <Label
      label="Цена 1 кв. м"
      bind:value={squarePrice}
      error={squarePrice == null}
    />
  </div>
  <div class="cell">
    <Label label="Плитки (шт)" bind:value={count} error={count == null} />
  </div>
</div>
<div class="row">
  <div class="cell">
    <Label label="Общая цена" bind:value={resultPrice} disabled />
  </div>
  <div class="cell">
    <Label label="Общая площадь (кв. м)" bind:value={resultArea} disabled />
  </div>
</div>

<style>
</style>
