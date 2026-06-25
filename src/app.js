import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const port = process.env.PORT;
const secret = process.env.JWT_SECRET;

const app = express();
app.use(express.json());


app.post('/login', (req, res) => {
    const user = {
        id: 1,
        username: "guest"
    };

    const token = jwt.sign(
        { 
            userId: user.id,
            name: user.username
        },
        secret,
        {
            expiresIn: '24h'
        }
    );

    res.json({ token });
});

app.post('/webhook', (req, res) => {
  console.log("Received event:", req.body);
  res.status(200).send('Webhook received');
});

app.listen(port, () => console.log('Server running on port', port));
