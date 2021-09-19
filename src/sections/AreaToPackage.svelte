<script lang="ts">
  import { round } from '../round'
  import Label from '../Label.svelte'

  export let singleArea = null
  let packArea = null

  let packCount = null

  $: {
    if (singleArea == null || packArea == null || singleArea === 0) {
      packCount = null
    } else {
      packCount = round(packArea / singleArea)
    }
  }
</script>

<div class="row">
  <div class="cell">
    <Label
      label="В упаковкe (кв. м)"
      bind:value={packArea}
      error={packArea == null}
    />
  </div>
  <div class="cell">
    <Label
      label="В упаковке (шт)"
      bind:value={packCount}
      disabled
      error={packCount === -1}
    />
  </div>
</div>
