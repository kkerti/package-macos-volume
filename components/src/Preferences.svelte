<svelte:options customElement={{tag: 'macos-volume-preference', shadow: 'none'}} />
<script>
  import { onMount } from "svelte";
  
  // @ts-ignore
  const messagePort = createPackageMessagePort("package-macos-volume", "preference");

  onMount(() => {
    messagePort.onmessage = (e) => {
      const data = e.data;
      console.log("onMount pref. ", data)
    };
    messagePort.start();
    return () => {
      messagePort.close();
    }
  })
</script>

<main-app>
  Demo for mac os volume control.    
</main-app>
