<script lang="ts">
  import MeterPrice from '../common/MeterPrice.svelte'
  import CellArea from '../common/CellArea.svelte'
  import { cellArea, meterPrice } from '../../stores'
  import { round } from '../../round'
  import Label from '../../Label.svelte'
  import Arrow from '../Arrow.svelte'

  let count = 1

  let totalPrice = null
  let totalArea = null
  let useCount = true
  let useMeterPrice = true

  $: {
    if (useCount) {
      totalArea = round($cellArea * (count || 0))
    } else {
      count = totalArea / $cellArea
    }

    if (useMeterPrice) {
      totalPrice = round(($meterPrice || 0) * $cellArea * (count || 0))
    } else {
      $meterPrice = totalPrice / (count || 0) / $cellArea
    }

    let singlePrice = ($meterPrice || 0) * $cellArea
    totalPrice = round(singlePrice * (count || 0))
    totalArea = round($cellArea * (count || 0))
  }
</script>

<div>
  <CellArea />
  <div class="row">
    <MeterPrice on:focus={() => (useMeterPrice = true)} />
    <div class="cell cell-small cell-center"
      ><Arrow left={!useMeterPrice} /></div
    >
    <div class="cell">
      <Label
        label="Общая цена"
        bind:value={totalPrice}
        on:focus={() => (useMeterPrice = false)}
      />
    </div>
  </div>
  <div class="row">
    <div class="cell">
      <Label
        label="Плитки (шт)"
        bind:value={count}
        error={count == null}
        placeholder="0"
        on:focus={() => (useCount = true)}
      />
    </div>
    <div class="cell cell-small cell-center"><Arrow left={!useCount} /></div>
    <div class="cell">
      <Label
        label="Общая площадь (кв. м)"
        bind:value={totalArea}
        on:focus={() => (useCount = false)}
      />
    </div>
  </div>
</div>

<style>
</style>
