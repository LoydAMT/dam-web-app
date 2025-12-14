const awsIot = require('aws-iot-device-sdk');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

// ================= CONFIGURATION =================
// 1. Your specific AWS Endpoint
const IOT_ENDPOINT = 'a1vzvyrus3qan7-ats.iot.us-west-2.amazonaws.com'; 

// 2. The Topic your ESP32 is listening to
const TOPIC = 'devices/BEC016-Thing-Group1/commands'; 

// 3. Client Configuration
const device = awsIot.device({
   keyPath: 'private.key',   // Must match your file name exactly
   certPath: 'device.crt',   // Must match your file name exactly
   caPath: 'root.pem',       // Must match your file name exactly
   
   // FIX: We use your Thing Name + "-Laptop" to satisfy policy 
   // but avoid kicking your ESP32 offline.
   clientId: 'BEC016-Thing-Group1',
   
   host: IOT_ENDPOINT
});

// ================= CONNECTION LOGIC =================

device.on('connect', function() {
   console.log('✅ Bridge Connected to AWS IoT Core');
});

device.on('error', function(error) {
    console.log('❌ AWS Connection Error:', error.message);
});

device.on('close', function() {
    console.log('⚠️ Connection Closed. Reconnecting...');
});

device.on('reconnect', function() {
    console.log('🔄 Reconnecting...');
});

device.on('offline', function() {
    console.log('zzZ Offline...');
});

// ================= WEB SERVER LOGIC =================

// This receives the click from your website
app.post('/command', (req, res) => {
    const action = req.body.action; // 'on' or 'off'
    
    // Create the JSON message
    const payload = JSON.stringify({ servo: action });

    console.log(`📤 Sending command to AWS: ${payload}`);

    // Publish to AWS
    device.publish(TOPIC, payload, (err) => {
        if (!err) {
            console.log('   -> Publish Success!');
            res.json({ status: 'success', message: `Sent ${action}` });
        } else {
            console.log('   -> Publish Failed:', err);
            res.status(500).json({ status: 'error', error: err });
        }
    });
});

// Start the local web server
app.listen(3000, () => {
    console.log('🚀 Web App running at http://localhost:3000');
});