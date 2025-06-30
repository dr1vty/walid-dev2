addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
  const upgrade = request.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("WebSocket only", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(request);

  socket.onopen = () => {
    const target = new WebSocket("wss://us2-full.privateip.net/cdn-cgi/trace", [
      "vless"
    ]);

    target.onopen = () => {
      socket.onmessage = (msg) => target.send(msg.data);
      target.onmessage = (msg) => socket.send(msg.data);
    };

    target.onerror = (e) => {
      console.log("Target error:", e);
      socket.close(1011, "target error");
    };

    target.onclose = () => socket.close(1000, "target closed");
  };

  socket.onerror = (e) => {
    console.log("Socket error:", e);
  };

  return response;
}
