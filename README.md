# Bank Alfalah Voice Recording Management System

A comprehensive production-ready voice recording management system built for Bank Alfalah with real-time monitoring, analytics, and administrative capabilities.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=flat)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-00000F?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)

## 🏦 Overview

The Bank Alfalah Voice Recording Management System is a full-stack application designed to monitor, manage, and analyze voice recording activities across bank branches. It provides real-time device monitoring, comprehensive analytics, and administrative tools for managing recording infrastructure.

## ✨ Key Features

### 🔐 Authentication & Authorization

- **Secure Login System**: Role-based authentication with admin and user roles
- **Password Reset**: Forgot password functionality with email verification
- **Protected Routes**: Role-based access control for sensitive operations
- **Branch-Based Filtering**: Automatic data filtering based on user's branch assignment

### 📊 Real-Time Dashboard

- **Live Device Monitoring**: Real-time heartbeat status of recording devices
- **Analytics Overview**: Quick insights into recording activity and system health
- **Interactive Charts**: Google Charts integration for data visualization
- **Branch-Specific Views**: Customized dashboards based on user permissions

### 🎙️ Recording Management

- **Recording History**: Comprehensive view of all voice recordings with metadata
- **Advanced Search**: Search recordings by CNIC, device name, date range
- **Audio Playback**: Built-in audio player with metadata display
- **Status Tracking**: Monitor recording status (completed, in_progress, failed)
- **File Management**: Upload, download, and organize audio files
- **Duration Calculation**: Automatic duration calculation and display

### 🖥️ Device Management (Admin Only)

- **Device Registration**: Add and configure recording devices
- **Real-Time Status**: Monitor device connectivity and health
- **Heartbeat Monitoring**: Track device online/offline status
- **IP Management**: Manage device IP addresses and network configuration
- **Maintenance Tracking**: Record installation dates and maintenance schedules
- **Branch Assignment**: Assign devices to specific bank branches

### 🏢 Branch Management (Admin Only)

- **Branch Configuration**: Manage bank branch information and settings
- **Contact Management**: Store branch contact details and addresses
- **Regional Organization**: Organize branches by regions and cities
- **Device Association**: Link recording devices to specific branches

### 👥 User Management (Admin Only)

- **User Accounts**: Create and manage user accounts with role assignments
- **Permission Control**: Assign admin or user roles with appropriate permissions
- **Branch Assignment**: Associate users with specific branches
- **Profile Management**: Update user information and contact details

### 📈 Advanced Analytics

- **Conversation Analytics**: Detailed analysis of customer interactions
- **Branch Performance**: Monitor recording activity by branch
- **Device Performance**: Track device utilization and reliability
- **Monthly Trends**: Visualize data trends over time periods
- **Customer Metrics**: Analyze unique customer interactions and walk-ins
- **Geographic Distribution**: View activity by city and region

### 📞 Complaints Management

- **Complaint Tracking**: Log and track customer complaints
- **Status Management**: Monitor complaint resolution progress
- **Priority Levels**: Assign priority levels to complaints
- **Branch Correlation**: Link complaints to specific branches
- **Analytics Dashboard**: View complaint trends and statistics
- **Notes System**: Add detailed notes and updates to complaints

### 🚀 Deployment Management (Admin Only)

- **System Deployments**: Manage system updates and deployments
- **Version Control**: Track deployment versions and changes
- **Branch-Specific Deployments**: Deploy updates to specific branches
- **Rollback Capabilities**: Manage deployment rollbacks if needed

### 🔧 System Administration

- **Health Monitoring**: System health checks and status monitoring
- **Debug Tools**: Development tools for troubleshooting
- **Audio File Management**: Fix and manage audio file mappings
- **Database Maintenance**: Tools for database optimization and cleanup

## 🏗️ Technical Architecture

### Frontend Stack

- **React 18**: Modern functional components with hooks
- **TypeScript**: Full type safety and IntelliSense support
- **React Router 6**: SPA routing with protected routes
- **Vite**: Fast development and build tooling
- **TailwindCSS 3**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Modern icon library
- **React Query**: Server state management
- **React Hook Form**: Form handling with validation

### Backend Stack

- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **TypeScript**: Type-safe server development
- **MySQL2**: Database connectivity with connection pooling
- **Zod**: Runtime type validation
- **Multer**: File upload handling
- **Nodemailer**: Email functionality
- **bcrypt**: Password hashing and security
- **JWT**: JSON Web Token authentication

### Database Schema

- **MySQL Database**: Production-ready database with optimized queries
- **Connection Pooling**: Efficient database connection management
- **Retry Logic**: Automatic retry for failed database operations
- **Migration Scripts**: Database initialization and updates

### UI/UX Components

- **Modern Design System**: Consistent styling with design tokens
- **Responsive Layout**: Mobile-first responsive design
- **Dark Mode Support**: Theme switching capabilities
- **Loading States**: Smooth loading indicators and skeletons
- **Error Handling**: User-friendly error messages
- **Accessibility**: WCAG compliant components

## 📁 Project Structure

```
├── client/                     # React frontend application
│   ├── components/             # Reusable UI components
│   │   ├── ui/                # Base UI component library (45+ components)
│   │   ├── AddContactModal.tsx # Contact addition modal
│   │   ├── AudioPlayer.tsx    # Advanced audio playback component
│   │   ├── DashboardLayout.tsx # Main dashboard layout
│   │   ├── Header.tsx         # Navigation header
│   │   └── ProtectedRoute.tsx # Route protection wrapper
│   ├── contexts/              # React context providers
│   │   └── AuthContext.tsx    # Authentication state management
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-mobile.tsx     # Mobile detection hook
│   │   └── use-toast.ts       # Toast notification hook
│   ├── lib/                   # Utility libraries
│   │   ├── api.ts             # API client and authentication
│   │   └── utils.ts           # Common utility functions
│   ├── pages/                 # Application pages/routes
│   │   ├── Index.tsx          # Home dashboard page
│   │   ├── Login.tsx          # Authentication page
│   │   ├── Recordings.tsx     # Recording management page
│   │   ├── DeviceManagement.tsx # Device administration
│   │   ├── BranchManagement.tsx # Branch administration
│   │   ├── UserManagement.tsx # User administration
│   │   ├── ConversationAnalytics.tsx # Analytics dashboard
│   │   ├── Complaints.tsx     # Complaint management
│   │   ├── Deployment.tsx     # System deployment management
│   │   ├── ForgotPassword.tsx # Password recovery
│   │   └── ResetPassword.tsx  # Password reset
│   ├── App.tsx                # Main application component
│   └── global.css             # Global styles and theme
├── server/                    # Express backend server
│   ├── config/                # Server configuration
│   │   ├── database.ts        # MySQL connection and pooling
│   │   ├── email.ts           # Email service configuration
│   │   ├── init-db.ts         # Database initialization
│   │   └── create-admin.ts    # Admin user creation
│   ├── middleware/            # Express middleware
│   │   └── auth.ts            # Authentication and authorization
│   ├── routes/                # API route handlers
│   │   ├── auth.ts            # Authentication endpoints
│   │   ├── recordings-db.ts   # Recording management API
│   │   ├── devices-db.ts      # Device management API
│   │   ├── branches-db.ts     # Branch management API
│   │   ├── users-db.ts        # User management API
│   │   ├── complaints-db.ts   # Complaint management API
│   │   ├── heartbeat-db.ts    # Device heartbeat monitoring
│   │   ├── voice-upload.ts    # Voice file upload handling
│   │   ├── conversation-analytics.ts # Analytics endpoints
│   │   ├── voice-streams-analytics.ts # Voice stream analytics
│   │   ├── deployments-db.ts  # Deployment management
│   │   └── analytics-db.ts    # General analytics
│   ├── scripts/               # Database migration scripts
│   ├── utils/                 # Server utilities
│   │   └── logger.ts          # Logging utilities
│   ├── index.ts               # Main server configuration
│   └── node-build.ts          # Production build configuration
├── shared/                    # Shared TypeScript types
│   └── api.ts                 # API interfaces and types
├── netlify/                   # Netlify deployment configuration
├── public/                    # Static assets
├── AGENTS.md                  # Project documentation
├── DEPLOYMENT.md              # Deployment guide
├── package.json               # Dependencies and scripts
├── tailwind.config.ts         # TailwindCSS configuration
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite build configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd voice-recording-management-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:

   ```env
   # Database Configuration
   DB_HOST=your-database-host
   DB_USER=your-database-user
   DB_PASS=your-database-password
   DB_NAME=your-database-name
   DB_PORT=3306

   # Email Configuration (for password reset)
   EMAIL_HOST=your-smtp-host
   EMAIL_PORT=587
   EMAIL_USER=your-email@domain.com
   EMAIL_PASS=your-email-password

   # Application Configuration
   NODE_ENV=development
   PORT=8080
   ```

4. **Database Setup**
   The application will automatically create required tables on first run. Ensure your MySQL database exists and is accessible.

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:8080`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run typecheck
```

## 🏗️ Building for Production

```bash
# Build client and server
npm run build

# Start production server
npm start
```

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/validate-token/:token` - Validate reset token

### Recording Management

- `GET /api/recordings` - List recordings with pagination and search
- `GET /api/recordings/:id` - Get specific recording details
- `POST /api/recordings` - Create new recording entry
- `PUT /api/recordings/:id` - Update recording information
- `GET /api/recordings/device-names` - Get available device names

### Device Management

- `GET /api/devices` - List all devices with filtering
- `GET /api/devices/:id` - Get specific device details
- `POST /api/devices` - Register new device
- `PUT /api/devices/:id` - Update device information
- `DELETE /api/devices/:id` - Remove device
- `GET /api/heartbeats` - Get device heartbeat status

### Analytics & Reporting

- `GET /api/analytics/conversations` - Conversation analytics
- `GET /api/analytics/conversations/branch` - Branch-wise analytics
- `GET /api/analytics/conversations/city` - City-wise analytics
- `GET /api/analytics/voice-streams` - Voice stream analytics
- `GET /api/analytics/branch-monthly-trend` - Monthly trends

### Administration

- `GET /api/branches` - Branch management
- `GET /api/users` - User management
- `GET /api/complaints` - Complaint management
- `GET /api/deployments` - Deployment management

## 🔒 Security Features

### Authentication & Authorization

- **JWT-based Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin and user role separation
- **Protected Routes**: Frontend and backend route protection
- **Session Management**: Automatic session handling and renewal

### Data Security

- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive input sanitization with Zod
- **SQL Injection Protection**: Parameterized queries and ORM
- **CORS Configuration**: Properly configured cross-origin policies

### Branch-Level Security

- **Data Isolation**: Users can only access their branch's data
- **Administrative Override**: Admins can access all branch data
- **Audit Trails**: Comprehensive logging of user actions

## 🌐 Deployment

The application supports multiple deployment options:

### Netlify (Recommended)

- Serverless functions for API endpoints
- Automatic builds and deployments
- CDN distribution for optimal performance

### Traditional Server

- Docker containerization support
- PM2 process management
- Load balancing capabilities

### Cloud Platforms

- Railway, Render, or Vercel deployment
- Environment variable management
- Automatic scaling options

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📊 Database Schema

### Core Tables

- **recording_history**: Voice recording metadata and file information
- **recording_heartbeat**: Device connectivity monitoring
- **device_mappings**: Device registration and network configuration
- **branches**: Bank branch information and contact details
- **users**: User accounts and role management
- **complaints**: Customer complaint tracking
- **deployments**: System deployment management

### Data Relationships

- Devices are assigned to specific branches
- Users are associated with branches for data access control
- Recordings are linked to devices and branches
- Complaints are tracked per branch for resolution

## 🔧 Development Tools

### Code Quality

- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting and consistency
- **TypeScript**: Static type checking
- **Vitest**: Unit and integration testing

### Development Experience

- **Hot Reload**: Instant feedback during development
- **Source Maps**: Debugging support in development
- **Error Boundaries**: Graceful error handling
- **DevTools Integration**: React and Redux DevTools support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 System Requirements

### Minimum Requirements

- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB free space for application and logs
- **Network**: Stable internet connection for real-time features

### Recommended Server Specs

- **CPU**: 2+ cores
- **RAM**: 8GB+
- **Storage**: SSD with 50GB+ free space
- **Network**: High-speed connection for optimal performance

## 🆘 Support & Troubleshooting

### Common Issues

1. **Database Connection**: Verify database credentials and network access
2. **Email Configuration**: Ensure SMTP settings are correct for password reset
3. **Audio Playback**: Check browser permissions for media playback
4. **File Uploads**: Verify server write permissions for upload directory

### Debug Endpoints

- `GET /api/ping` - Health check
- `GET /api/debug/audio-files` - Audio file diagnostics
- `POST /api/debug/promote-to-manager` - Development user promotion

### Logging

- Server logs include detailed error information
- Frontend errors are captured and logged
- Database query logging for performance monitoring

## 📈 Performance Optimization

### Frontend Optimizations

- **Code Splitting**: Lazy loading of routes and components
- **Image Optimization**: Responsive images with proper sizing
- **Caching Strategies**: Browser caching for static assets
- **Bundle Analysis**: Regular bundle size monitoring

### Backend Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connection management
- **API Caching**: Response caching for frequently requested data
- **Compression**: Gzip compression for reduced payload sizes

## 📞 Contact & Support

**Development Team**: SE TECH (Pvt.) Ltd.  
**Technical Support**: Contact your system administrator  
**Documentation**: See project documentation files

---

## 📄 License

This project is proprietary software developed specifically for Bank Alfalah. All rights reserved.

---

_Built with ❤️ by SE TECH (Pvt.) Ltd. for Bank Alfalah_
