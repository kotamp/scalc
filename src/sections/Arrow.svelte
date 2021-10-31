<script lang="ts">
  export let left
</script>

<svg
  class:left
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="feather feather-arrow-right"
  ><line x1="5" y1="12" x2="19" y2="12" /><polyline
    points="12 5 19 12 12 19"
  /></svg
>

<style>
  svg {
    transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
  }

  .left {
    transform: rotate(180deg);
  }
</style>
