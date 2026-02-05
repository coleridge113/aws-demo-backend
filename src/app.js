import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { CreateProvisioningClaimCommand, IoTClient } from '@aws-sdk/client-iot';

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

const iotClient = new IoTClient({ 
    region: 'ap-southeast-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

app.post('/get-iot-claim', async (req, res) => {
    try {
        const { token } = req.body;

        // Optional validation logic for token
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: Missing JWT' });
        }

        const riderId = "RIDER_123";
        const command = new CreateProvisioningClaimCommand({
            templateName: "RiderAppTemplate"
        });

        const response = await iotClient.send(command);
        const privateKeyObject = crypto.createPrivateKey(response.keyPair?.PrivateKey);
        const pkcs8Key = privateKeyObject.export({
            type: 'pkcs8', // pkcs1
            format: 'pem'
        });

        // Temporary certificates
        res.json({
            certificatePem: response.certificatePem,
            privateKey: pkcs8Key,
            expiration: response.expiration,
            riderId: riderId
        });

    } catch (err) {
        console.error('Provisioning error', err); 
        res.status(500).json({ error: 'Failed to generate claim'});
    }
});

app.listen(port, () => console.log('Server running on port', port));
