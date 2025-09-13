<svelte:options customElement={{tag: 'macos-volume-preference', shadow: 'none'}} />
<script>
  import { onMount } from "svelte";

  let clientId = "";
  let clientSecret = "";
  let clientStatus = "";

  // @ts-ignore
  const messagePort = createPackageMessagePort("package-macos-volume", "preference");

  onMount(() => {
    messagePort.onmessage = (e) => {
      const data = e.data;
      if (data.type === "clientInit") {
        clientId = data.message.clientId;
        clientSecret = data.message.clientSecret;
        clientStatus = data.message.clientStatus;
      }
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
