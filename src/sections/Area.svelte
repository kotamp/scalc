<script lang="ts">
  import { round } from '../round'
  import Label from '../Label.svelte'
  let width = null
  let length = null
  export let singleArea = null
  export let mustNotZero = null

  $: console.log(width, length)

  $: {
    if (width == null || length == null) {
      singleArea = 0
    } else {
      const result = (width || 0) * (length || 0) * 0.0001
      console.log(result, width, length)
      singleArea = round(result)
    }
  }
</script>

<div class="row">
  <div class="cell">
    <Label
      label="Ширина (см)"
      bind:value={width}
      error={width == null}
      placeholder="0"
    />
  </div>
  <div class="cell">
    <Label
      label="Длина (см)"
      bind:value={length}
      error={length == null}
      placeholder="0"
    />
  </div>
</div>
<div class="row">
  <div class="cell">
    <Label
      label="Площадь (кв. м)"
      bind:value={singleArea}
      disabled
      error={mustNotZero && singleArea === 0}
    />
  </div>
</div>

<style></style>
