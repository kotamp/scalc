<script lang="ts">
  import Label from '../Label.svelte'
  export let singleArea = null
  let squarePrice = null
  export let singlePrice = null

  $: {
    if (squarePrice == null || singleArea == null) {
      singlePrice = null
    } else {
      singlePrice = singleArea * squarePrice
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
    <Label label="Цена Плитки" bind:value={singlePrice} disabled />
  </div>
</div>
