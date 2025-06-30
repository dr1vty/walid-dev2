addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(req: Request): Promise<Response> {
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() != "websocket") {
    return new Response("Only WebSocket supported", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    const target = new WebSocket("wss://us2-full.privateip.net/cdn-cgi/trace");

    target.onopen = () => {
      socket.onmessage = (e) => target.send(e.data);
      target.onmessage = (e) => socket.send(e.data);
    };

    target.onerror = () => socket.close(1011, "target error");
    target.onclose = () => socket.close(1000, "target closed");
  };

  socket.onerror = () => {};

  return response;
}
