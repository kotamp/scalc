<script lang="ts">
  import { round } from '../round'
  import Label from '../Label.svelte'

  export let singleArea = null
  let squarePrice = null
  let count = 1

  let resultPrice = null
  let resultArea = null

  $: {
    // if (count == null) count = 0
    // if (squarePrice == null) squarePrice = 0
    // if (squarePrice == null || singleArea == null || count === null) {
    //   resultPrice = null
    //   resultArea = null
    // } else {
    let singlePrice = (squarePrice || 0) * singleArea
    resultPrice = round(singlePrice * (count || 0))
    resultArea = round(singleArea * (count || 0))
    // }
  }
</script>

<div class="row">
  <div class="cell">
    <Label
      label="Цена 1 кв. м"
      bind:value={squarePrice}
      error={squarePrice == null}
      placeholder="0"
    />
  </div>
  <div class="cell">
    <Label
      label="Плитки (шт)"
      bind:value={count}
      error={count == null}
      placeholder="0"
    />
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
