import { WebSocket } from "ws";

const socket = new WebSocket("ws://localhost:3002?v=9&encoding=json");

socket.onopen = () => {
  console.log("connected");
};

socket.onmessage = (data) => {
  console.log("got data", data);

  const d = data.data as unknown as { op: number };

  switch (d.op) {
    case 10: {
      console.log("gw is awaiting auth");
      break;
    }
    default:
  }
};
