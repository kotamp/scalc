<script lang="ts">
  import CellArea from '../common/CellArea.svelte'
  import { cellArea } from '../../stores'
  import { round } from '../../round'
  import Label from '../../Label.svelte'

  let packArea = null
  let packCount = null

  $: {
    if ($cellArea == null || $cellArea === 0) {
      packCount = null
    } else {
      packCount = round((packArea || 0) / $cellArea)
    }
  }
</script>

<div>
  <CellArea mustNotZero={true} />
  <div class="row">
    <div class="cell">
      <Label
        label="В упаковкe (кв. м)"
        bind:value={packArea}
        error={packArea == null}
        placeholder="0"
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
</div>
