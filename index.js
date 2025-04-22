import express from 'express';
import cors from 'cors';
import { SignJWT, jwtVerify } from 'jose';
import { config } from 'dotenv';

const app = express();
app.use(cors());
app.use(express.json());

config();
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Routes

app.post('/api/payment', async (req, res) => {
    const data = req.body;
    let locale = 'mm';
    // if(data.locale == 'mm') {
    //     locale = 'my'
    // }

    const tokenRequestPayload = {
        "merchantID": "JT04",
        "invoiceNo": generateInvoiceNumber(),
        "description": data.description,
        "amount": data.amount || '',
        "currencyCode": "MMK",
        "paymentChannel": data.paymentMethod || '',
        "frontendReturnUrl": data.frontendReturnUrl,
        "backendReturnUrl": 'https://music-app-api-test.vercel.app/api/paymentTest',
        "locale": locale
    }
    
    res.status(200).json(await getPaymentToken(tokenRequestPayload));

});

app.post('/api/paymentStatus', async (req, res) => {
    const tokenRequestPayload = {
        "merchantID": "JT04",
        "paymentToken": req.body.paymentToken
    };
    console.log(tokenRequestPayload)
    res.status(200).json(await getPaymentStatus(tokenRequestPayload));
});

async function getPaymentToken(tokenRequestPayload) {
    try {
        const jwt = await generateJWT(tokenRequestPayload);
        const responseJWT = await requestPaymentToken(jwt);
        const responseJWTDecoded = await verifyJWT(responseJWT);
        return responseJWTDecoded;
    } catch (err) {
        console.error('Error in payment flow:', err)
    }
}

async function getPaymentStatus(tokenRequestPayload) {

    
    try {
        const jwt = await generateJWT(tokenRequestPayload);
        console.log(jwt)
        const responseJWT = await requestPaymentStatus(jwt);
        console.log(responseJWT);
        const responseJWTDecoded = await verifyJWT(responseJWT);
        return responseJWTDecoded;
    } catch (err) {
        console.error('Error in payment flow:', err)
    }
}

async function generateJWT(data) {
    const jwt = await new SignJWT(data)
        .setProtectedHeader({ alg: 'HS256', type: "JWT" })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secret)

    return jwt
}

async function requestPaymentToken(token) {
    const response = await fetch('https://sandbox-pgw.2c2p.com/payment/4.3/paymentToken', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            payload: token
        })
    })

    const data = await response.json()
    return data.payload;
}

async function requestPaymentStatus(payloadData) {
    const response = await fetch('https://sandbox-pgw.2c2p.com/payment/4.3/paymentInquiry', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            payload: payloadData
        })
    })

    const data = await response.json()
    console.log(data);
    return data.payload;
}

async function verifyJWT(token) {
    try {
        const { payload, protectedHeader } = await jwtVerify(token, secret)
        return payload;
    } catch (err) {
        console.error('Invalid token:', err)
        return null
    }
}

function generateInvoiceNumber() {
    const date = new Date();
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`;
}


export default app;
