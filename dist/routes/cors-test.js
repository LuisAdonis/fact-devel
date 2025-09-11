"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/cors-test', (req, res) => {
    const origin = req.get('Origin');
    const userAgent = req.get('User-Agent');
    const method = req.method;
    console.log(`🧪 CORS Test Request:`);
    console.log(`   Origin: ${origin || 'No origin'}`);
    console.log(`   Method: ${method}`);
    console.log(`   User-Agent: ${userAgent}`);
    res.json({
        message: '✅ CORS is working correctly!',
        timestamp: new Date().toISOString(),
        requestInfo: {
            origin: origin || 'No origin',
            method,
            path: req.path,
            userAgent,
            headers: req.headers,
        },
        corsInfo: {
            status: 'success',
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            credentialsAllowed: true,
        },
    });
});
// Endpoint POST para probar CORS con datos
router.post('/cors-test', (req, res) => {
    const origin = req.get('Origin');
    console.log(`🧪 CORS POST Test Request from: ${origin || 'No origin'}`);
    console.log(`📋 Body:`, req.body);
    res.json({
        message: '✅ CORS POST request successful!',
        receivedData: req.body,
        timestamp: new Date().toISOString(),
        origin: origin || 'No origin',
    });
});
exports.default = router;
