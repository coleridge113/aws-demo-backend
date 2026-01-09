import express, { type Request, type Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.post('/events', (req: Request, res: Response) => {
    const event = req.body;
    console.log("Received event:", event);

    wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(event));
        }
    });

    res.sendStatus(200);
});

server.listen(4000, () => {
    console.log("Backend running on port 4000");
});
