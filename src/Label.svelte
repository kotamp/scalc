<script lang="ts">
  export let label = 'Label'
  export let value = 0.4
  export let disabled = false
  export let error = ''
  export let placeholder = ''
  const labelId = label.toLowerCase() + Math.random()

  // $: {
  //   console.log(width, length, area)
  //   area = parseFloat(width) * parseFloat(length)
  // }
</script>

<div>
  <label for={labelId}>{label}</label>
  <input
    type="number"
    name={labelId}
    bind:value
    {disabled}
    class:error
    {placeholder}
  />
</div>

<style>
  div {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  label {
    flex: 1 0 auto;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }
  .input {
  }
  input {
    display: block;
    width: 100%;
    font-family: inherit;
    font-size: 20px;
    font-size: max(20px, 1.25em);
    -webkit-padding: 0.5em 0;
    padding: 0.5em;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #fff;
  }
  input.error {
    /* border-style: dashed; */
    border-color: #ff3e00;
  }
  input:disabled {
    background-clip: padding-box;
    color: #000;
    background-color: transparent;
    border-color: #fff;
    opacity: 1;
    border-radius: 0;
    border-bottom: 1px solid #ccc;
    -webkit-text-fill-color: #000;
  }
  input:disabled.error {
    border-bottom-color: #ff3e00;
  }
</style>
