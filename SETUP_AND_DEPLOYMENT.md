# ShareSpace Video Conference - Setup & Deployment Guide

## Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB running and accessible
- npm or yarn package manager

### Installation Steps

#### 1. Backend Setup
```bash
cd BACKEND
npm install
npm run dev
```

The backend should now be running on `http://localhost:5000`

#### 2. Frontend Setup
```bash
cd FRONTEND
npm install
npm run dev
```

The frontend should now be running on `http://localhost:5173`

### Environment Variables

#### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sharespace
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

#### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Testing the Video Conference Feature

### Test Team Video Call
1. Open `http://localhost:5173` in one browser window
2. Login with test account (User A)
3. Create or select a team
4. Click **Group Chat** tab
5. Click the **green video icon** in chat header
6. Grant camera/microphone permissions
7. Open another browser window/incognito (preferably on another device)
8. Login with a different account (User B) in the same team
9. Click the same **green video icon**
10. Both users should see each other's video feeds

### Test Personal Video Call
1. With both users logged in, click the **Chat icon** from the main menu
2. Select a contact (User B in this case)
3. In the chat dialog header, click the **green video icon**
4. The receiving user (User B) should get an incoming call notification
5. User B can accept or reject the call
6. Once accepted, both can see each other's video

## Production Deployment

### Backend Deployment (Node.js)
1. Set `NODE_ENV=production` in .env
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "sharespace-backend"
   pm2 save
   ```
3. Setup reverse proxy (Nginx/Apache) for HTTPS
4. Ensure WebSocket connections are proxied correctly

### Frontend Deployment (Static Hosting)
1. Build the project:
   ```bash
   npm run build
   ```
2. Upload `dist` folder to your hosting service
3. Configure environment variables for production API URL
4. Ensure HTTPS is enabled (required for WebRTC)

### Nginx Configuration Example
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /var/www/sharespace/dist;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:5000/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Performance Optimization

### For Large Teams (5+ participants)
1. **Bandwidth Optimization**: Implement selective forwarding instead of full-mesh
2. **Quality Adaptation**: Add bandwidth detection and quality adjustment
3. **Server-Side MCU**: Consider using Jitsi or Livekit for large conferences
4. **Load Balancing**: Distribute Socket.io across multiple server instances

### Recommended Packages for Enhancement
```bash
npm install --save mediasoup  # For large-scale video conferencing
# or
npm install --save livekit-client  # For enterprise-grade solution
```

## Monitoring & Debugging

### Enable Detailed Logging
In `BACKEND/server.js`, enable verbose logging:
```javascript
// Uncomment for debugging
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] User ${socket.userId} connected`);
  // ... rest of code
});
```

### Check WebRTC Connections
Open browser DevTools:
1. **Chrome**: `chrome://webrtc-internals/`
2. **Firefox**: `about:config` → search "webrtc" for stats

### Monitor Socket.io Events
Add event logging in frontend:
```typescript
socket?.on('videoCall:*', (data) => {
  console.log('[VideoCall Event]', data);
});
```

## Troubleshooting Common Issues

### CORS Errors
Ensure backend CORS is configured for your frontend URL:
```javascript
// In server.js
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // Should match your frontend URL
    credentials: true
  }
});
```

### WebSocket Connection Fails
1. Check if backend is running and accessible
2. Verify firewall isn't blocking WebSocket
3. Ensure HTTPS in production (HTTP only for localhost)
4. Check browser console for connection errors

### No Video Feed Appearing
1. Check browser permissions for camera
2. Verify camera/microphone is connected and working
3. Try different browser
4. Check system audio settings

### High Latency/Lag
1. Reduce participant count
2. Check internet speed (speedtest.net)
3. Enable QoS on your network if available
4. Upgrade server hardware
5. Consider CDN for backend API

## Security Considerations

### For Production:
1. ✓ Use HTTPS/WSS (secure WebSocket)
2. ✓ Implement rate limiting on Socket.io events
3. ✓ Validate all incoming messages
4. ✓ Use authentication tokens (already implemented)
5. ✓ Enable CORS only for your domain
6. ✓ Implement TURN servers for restrictive networks
7. ✓ Regular security audits

### Adding TURN Server
```javascript
// In VideoCall.tsx
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:your-turn-server.com',
      username: 'username',
      credential: 'password'
    }
  ]
});
```

## Support for WebRTC Libraries (Optional)

### For Advanced Use Cases:
```bash
# For MCU-based conferencing
npm install --save simple-webrtc

# For quality of service
npm install --save webrtc-adapter

# For recording
npm install --save recordrtc
```

## Next Steps

1. **Test thoroughly** with multiple browsers and devices
2. **Monitor production** logs for any WebRTC errors
3. **Gather feedback** from users about video quality
4. **Implement advanced features** like screen sharing
5. **Optimize for your specific use case**

---

**Last Updated**: December 8, 2025
**Version**: 1.0.0
