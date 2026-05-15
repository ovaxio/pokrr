import type * as Party from "partykit/server";

export default class PokrrRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `[pokrr] connect id=${conn.id} room=${this.room.id} url=${new URL(ctx.request.url).pathname}`,
    );
    conn.send(JSON.stringify({ type: "hello", roomId: this.room.id, connId: conn.id }));
  }

  onMessage(message: string, sender: Party.Connection) {
    console.log(`[pokrr] msg id=${sender.id} room=${this.room.id} body=${message}`);
    this.room.broadcast(message, [sender.id]);
  }

  onClose(conn: Party.Connection) {
    console.log(`[pokrr] disconnect id=${conn.id} room=${this.room.id}`);
  }
}

PokrrRoom satisfies Party.Worker;
