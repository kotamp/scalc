<script lang="ts">
  import MeterPrice from '../common/MeterPrice.svelte'
  import { meterPrice } from '../../stores'
  import Label from '../../Label.svelte'

  let totalArea = null
  let areaPrice = null

  $: {
    if ($meterPrice == null || totalArea == null) {
      areaPrice = null
    } else {
      areaPrice = $meterPrice * totalArea
    }
  }
</script>

<div>
  <div class="row">
    <MeterPrice />
  </div>
  <div class="row">
    <div class="cell">
      <Label
        label="Общая площадь"
        bind:value={totalArea}
        error={totalArea == null}
        placeholder="0"
      /></div
    ><div class="cell">
      <Label
        label="Общая цена"
        bind:value={areaPrice}
        error={areaPrice == null}
        placeholder="0"
      /></div
    >
  </div>
</div>
