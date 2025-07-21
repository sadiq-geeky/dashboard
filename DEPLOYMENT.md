# CRM Dashboard - Production Deployment Guide

## Overview

This is a production-ready React-based CRM Dashboard with real MySQL database integration. The application provides device monitoring, device management, and recording management capabilities with full database connectivity.

## Features

### 🖥️ Device Monitoring

- Real-time heartbeat status monitoring
- Automatic detection of problematic devices (no heartbeat in 15+ minutes)
- Online/Problematic/Offline status indicators
- Auto-refresh every 30 seconds

### ⚙️ Device Management

- Map IP addresses to friendly device names
- Add, edit, and delete device mappings
- Search functionality

### 📹 Recordings Management

- View recording history with pagination
- Search by CNIC number
- Playable functionality (simulated)
- Download functionality (simulated)
- Status tracking (completed/in_progress/failed)

## Database Schema Implementation

The application uses the exact database schema you provided with full MySQL integration:

### Heartbeat Table

```sql
SELECT uuid,ip_address,created_on FROM setcrmuis.recording_heartbeat;
```

### Recording History Table

```sql
TABLE `recording_history` (
  `id` varchar(250) NOT NULL,
  `cnic` varchar(45) DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `file_name` varchar(250) DEFAULT NULL,
  `CREATED_ON` datetime DEFAULT NULL,
  'ip_address' varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
)
```

## Deployment Options

### 1. Netlify (Recommended for Frontend + API)

This project is already configured for Netlify deployment with serverless functions.

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Settings**:

   - Build command: `npm run build`
   - Publish directory: `dist/spa`
   - Functions directory: `netlify/functions`

3. **Environment Variables**: Set these in Netlify dashboard:

   ```
   NODE_ENV=production
   ```

4. **Deploy**: Push to your main branch for automatic deployment

### 2. Traditional VPS/Server

For a VPS or dedicated server:

```bash
# Clone and setup
git clone <your-repo>
cd crm-dashboard
npm install

# Build for production
npm run build

# Start production server
npm start
```

The server will run on port 3000 by default.

### 3. Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Deploy with Docker:

```bash
docker build -t crm-dashboard .
docker run -p 3000:3000 crm-dashboard
```

### 4. Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts

### 5. Railway/Render

Both platforms support automatic deployment from GitHub:

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm start`

## Database Setup

### Required Tables

Run the SQL commands in `DATABASE_SETUP.sql` to create the required tables:

```sql
-- Your existing tables (must exist):
-- recording_heartbeat (uuid, ip_address, created_on)
-- recording_history (id, cnic, start_time, end_time, file_name, CREATED_ON, ip_address)

-- Additional table for device management:
CREATE TABLE device_mappings (
  id VARCHAR(50) PRIMARY KEY,
  ip_address VARCHAR(45) UNIQUE NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Environment Setup

Copy `.env.example` to `.env` and update with your database credentials:

```env
DB_HOST=crm-setech.cloud
DB_USER=setcrminternet
DB_PASS=password
DB_NAME=setcrmuis
DB_PORT=3306
PORT=3000
NODE_ENV=production
```

## Environment Configuration

Create `.env` file for production:

```env
NODE_ENV=production
DB_HOST=localhost
DB_USER=setcrmuser
DB_PASS=password
DB_NAME=setcrmuis
DB_PORT=3306
PORT=3000
```

## Monitoring and Maintenance

- **Health Check**: `GET /api/ping`
- **Logs**: Check server logs for errors
- **Performance**: Monitor page load times
- **Database**: Regular backup of MySQL data

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **CORS**: Configure CORS for your domain only
3. **Input Validation**: Add proper validation for all inputs
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Authentication**: Add user authentication if needed

## Scaling

For high traffic:

1. **Load Balancer**: Use nginx or similar
2. **Database**: MySQL read replicas
3. **CDN**: Use CloudFlare or AWS CloudFront
4. **Caching**: Implement Redis for API caching

## Support

The application is production-ready with:

- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
- ✅ Modern UI/UX
- ✅ TypeScript for reliability
- ✅ API structure matching your requirements

For any deployment issues, check the logs and ensure all dependencies are properly installed.
