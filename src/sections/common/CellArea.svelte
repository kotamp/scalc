<script lang="ts">
  import { cellWidth, cellLength, cellArea } from '../../stores'
  import { round } from '../../round'
  import Label from '../../Label.svelte'
  export let mustNotZero = null

  $: {
    if ($cellWidth == null || $cellLength == null) {
      $cellArea = 0
    } else {
      const result = ($cellWidth || 0) * ($cellLength || 0) * 0.0001
      $cellArea = round(result)
    }
  }
</script>

<div class="row">
  <div class="cell">
    <Label
      label="Ширина (см)"
      bind:value={$cellWidth}
      error={$cellWidth == null}
      placeholder="0"
    />
  </div>
  <div class="cell">
    <Label
      label="Длина (см)"
      bind:value={$cellLength}
      error={$cellLength == null}
      placeholder="0"
    />
  </div>
</div>
<div class="row">
  <div class="cell">
    <Label
      label="Площадь (кв. м)"
      bind:value={$cellArea}
      error={mustNotZero && $cellArea === 0}
      disabled
    />
  </div>
</div>
