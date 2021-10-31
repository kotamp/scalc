<script lang="ts">
  import MeterPrice from '../common/MeterPrice.svelte'
  import CellArea from '../common/CellArea.svelte'
  import { cellArea, meterPrice } from '../../stores'
  import { round } from '../../round'
  import Label from '../../Label.svelte'

  let count = 1

  let resultPrice = null
  let resultArea = null

  $: {
    let singlePrice = ($meterPrice || 0) * $cellArea
    resultPrice = round(singlePrice * (count || 0))
    resultArea = round($cellArea * (count || 0))
  }
</script>

<div>
  <CellArea />
  <div class="row">
    <MeterPrice />
    <div class="cell">
      <Label label="Общая цена" bind:value={resultPrice} disabled />
    </div>
  </div>
  <div class="row">
    <div class="cell">
      <Label
        label="Плитки (шт)"
        bind:value={count}
        error={count == null}
        placeholder="0"
      />
    </div>
    <div class="cell">
      <Label label="Общая площадь (кв. м)" bind:value={resultArea} disabled />
    </div>
  </div>
</div>

<style>
</style>
