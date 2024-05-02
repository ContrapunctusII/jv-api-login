import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: '*' }));

app.get('/', async (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send(JSON.stringify('hello world'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Vérifier si les paramètres sont présents
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    // URL de l'API cible
    const apiUrl = 'https://api.jeuxvideo.com/v4/accounts/login';

    try {
        // Effectuer une requête POST à l'API cible avec les données d'identification
        const authorizationHeader = createJvcAuthorizationHeader();
        const headers = {"Jvc-Authorization":authorizationHeader,
        "Content-Type": "application/json",
        "jvc-app-platform":"Android",
        "jvc-app-version":"267",
        "user-agent":"JeuxVideo-Android/267"
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ alias: username, password }),
        });

        // Vérifier si la requête a réussi
        if (!response.ok) {
            const responseData = await response.json();
            return res.status(response.status).json(responseData);
        }

        const responseData = await response.json();
        const cookies = response.headers.raw()['set-cookie'].toString();
        responseData['coniunctio'] = cookies.split(';')[0].split('=')[1];
        res.json(responseData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const apiVersion = 4;
const partnerKey = '550c04bf5cb2b';
const hmacSecret = 'd84e9e5f191ea4ffc39c22d11c77dd6c';
const method = 'POST';
const path = 'accounts/login';

function createJvcAuthorizationHeader() {
    const date = new Date().toISOString();
    const signatureStr = `${partnerKey}\n${date}\n${method}\napi.jeuxvideo.com\n/v${apiVersion}/${path}\n`;
    
    const hmac = crypto.createHmac('sha256', hmacSecret);
    hmac.update(signatureStr);
    const signatureHex = hmac.digest('hex');
    
    return `PartnerKey=${partnerKey}, Signature=${signatureHex}, Timestamp=${date}`;
}