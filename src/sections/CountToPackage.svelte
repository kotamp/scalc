<script lang="ts">
  import Label from '../Label.svelte'
  let count = null
  let packCount = null

  let result = null
  let resultRemain = null
  let resultCeil = null
  let resultCount = null
  // count

  $: {
    console.log(packCount)
    if (packCount === 0 || packCount == null || count == null) {
      result = null
      resultRemain = null
      resultCeil = null
      resultCount = null
    } else {
      resultCeil = Math.ceil(count / packCount)
      resultRemain = resultCeil * packCount - count
      result = count / packCount
      resultCount = resultCeil * packCount
    }
  }
</script>

<div class="row">
  <div class="cell">
    <Label label="Надо плиток (шт)" bind:value={count} error={count == null} />
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
<div class="row">
  <div class="cell">
    <Label
      label="Кол-во упаковок"
      bind:value={result}
      disabled
      error={result === -1}
    />
  </div>
</div>
<div class="row">
  <div class="cell">
    <Label
      label="Целые упаковки (шт)"
      bind:value={resultCeil}
      disabled
      error={resultCeil === -1}
    />
  </div>
  <div class="cell">
    <Label
      label="Всего плиток (шт)"
      bind:value={resultCount}
      disabled
      error={resultCeil === -1}
    />
  </div>
</div>
<div class="row">
  <div class="cell">
    <Label
      label="Лишниe плитки (шт)"
      bind:value={resultRemain}
      disabled
      error={resultRemain === -1}
    />
  </div>
</div>
