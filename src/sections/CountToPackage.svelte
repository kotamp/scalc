<script lang="ts">
  import Label from '../Label.svelte'
  let count = null
  let packCount = null

  // let result = null
  let resultRemain = null
  let resultCeil = null
  let resultCount = null

  $: {
    if (packCount === 0 || packCount == null) {
      // result = null
      resultRemain = null
      resultCeil = null
      resultCount = null
    } else {
      resultCeil = Math.ceil((count || 0) / packCount)
      resultRemain = resultCeil * packCount - (count || 0)
      resultCount = resultCeil * packCount
      // result = count / packCount
    }
  }
</script>

<div class="row">
  <div class="cell">
    <Label
      label="Надо плиток (шт)"
      bind:value={count}
      error={count == null}
      placeholder="0"
    />
  </div>
</div>
<div class="row">
  <div class="cell">
    <Label
      label="Плиток в упаковке (шт)"
      bind:value={packCount}
      error={packCount == null || packCount === 0}
    />
  </div>
</div>
<!-- <div class="row">
  <div class="cell">
    <Label
      label="Кол-во упаковок"
      bind:value={result}
      disabled
      error={result === -1}
    />
  </div>
</div> -->
<div class="row">
  <div class="cell">
    <Label label="Упаковки (шт)" bind:value={resultCeil} disabled />
  </div>
</div>
<div class="row">
  <div class="cell">
    <Label label="Плитки (шт)" bind:value={resultCount} disabled />
  </div>
  <div class="cell">
    <Label
      label="Остаток (шт)"
      bind:value={resultRemain}
      disabled
      error={resultRemain != null && resultRemain !== 0}
    />
  </div>
</div>
