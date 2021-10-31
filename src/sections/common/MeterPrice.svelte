<script lang="ts">
  import { meterPrice } from '../../stores'
  import Label from '../../Label.svelte'
</script>

<div class="cell">
  <Label
    label="Цена 1 кв. м"
    bind:value={$meterPrice}
    error={$meterPrice == null}
    placeholder="0"
    on:focus
  />
</div>
