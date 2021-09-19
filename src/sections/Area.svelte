<script lang="ts">
  import { round } from '../round'
  import Label from '../Label.svelte'
  let width = null
  let length = null
  export let singleArea = null
  export let mustNotZero = null

  $: singleArea =
    width == null || length == null
      ? null
      : round((width || 0) * (length || 0) * 0.0001)
</script>

<div class="row">
  <div class="cell">
    <Label label="Ширина (см)" bind:value={width} error={width == null} />
  </div>
  <div class="cell">
    <Label label="Длина (см)" bind:value={length} error={length == null} />
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
