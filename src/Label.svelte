<script lang="ts">
  export let label = 'Label'
  export let value = 0.4
  export let disabled = false
  export let error = ''
  const labelId = label.toLowerCase() + Math.random()

  // $: {
  //   console.log(width, length, area)
  //   area = parseFloat(width) * parseFloat(length)
  // }
</script>

<div>
  <label for="labelId">{label}</label>
  <input type="number" name="labelId" bind:value {disabled} class:error />
</div>

<style>
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }
  input {
    display: block;
    width: 100%;
    font-family: inherit;
    font-size: 1.25rem;
    -webkit-padding: 0.4em 0;
    padding: 0.4em;
    margin: 0 0 0.5em 0;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 2px;
  }
  input:disabled {
    color: #000;
    background-color: transparent;
    border-color: #ff3e00;
  }

  input.error {
    background-color: #ff3e0033;
  }
</style>
