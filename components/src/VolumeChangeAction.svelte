<svelte:options customElement={{tag: 'volume-change-action', shadow: 'none'}} />
<script>
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";
  let inputValue = "";
  let currentCodeValue = "";
  let isConfigured = false;
  let ref;

  function handleConfigUpdate(config) {
    const regex = /^gps\("package-macos-volume", "input", (.*?)\)$/;

    const match = config.script.match(regex);

    if (currentCodeValue != config.script){
        currentCodeValue = config.script;
        inputValue = match ? match[1] : "";
        isConfigured = true;
    }
  }

  onMount(() => {
    const event = new CustomEvent("updateConfigHandler", {
        bubbles: true,
        detail: { handler: handleConfigUpdate },
    });
    ref.dispatchEvent(event);
  });

  $: inputValue, isConfigured && function() {
    var code = `gps("package-macos-volume", "input", ${inputValue})`;
    if (currentCodeValue != code){
        currentCodeValue = code;    
        const event = new CustomEvent("updateCode", {
            bubbles: true,
            detail: { script: String(code) },
        });
        if (ref){
            ref.dispatchEvent(event);
        }
    }
  }()
</script>

<volume-control 
  class="{$$props.class} flex flex-col w-full pb-2 px-2 pointer-events-auto"
  bind:this={ref}
>
  <div class="w-full flex">
    <div class="" style="width: 100%;">
      <MeltCombo
        bind:value={inputValue}
        title="Value" />
    </div>
  </div>
</volume-control>