import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { CreateProvisioningClaimCommand, IoTClient, ListThingPrincipalsCommand, UpdateCertificateCommand } from '@aws-sdk/client-iot';

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
            templateName: "RiderAppTemplate"// Fleet Provisioning Template
        });

        const response = await iotClient.send(command); // device cert, private key, public key
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

app.post('/deactivate-certificate', async (req, res) => {
    const { riderId } = req.body;

    try {
        const response = await iotClient.send(new ListThingPrincipalsCommand({
            thingName: riderId
        }));

        const certificateArns = response.principals || [];

        for (const arn of certificateArns) {
            if (arn.includes(":cert/")) {
                const certificateId = arn.split("/")[1];
                await iotClient.send(new UpdateCertificateCommand({
                    certificateId: certificateId,
                    newStatus: "INACTIVE"
                }));
            }
        }

        res.status(200).json({ success: `Deactivated ${certificateArns.length} certs for ${riderId}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            error: 'Failed to deactivate cert', 
            message: err.message,
            code: err.name
        });
    }
});

app.listen(port, () => console.log('Server running on port', port));
