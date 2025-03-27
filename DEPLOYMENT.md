# Weekly Planner System: Installation and Deployment Guide

This document provides detailed instructions for installing, configuring, and deploying the Weekly Planner System.

## Local Development Setup

### Prerequisites

- Node.js (v16.x or higher)
- npm (v8.x or higher)
- PostgreSQL (v14.x or higher)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd weekly-planner-system
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database connection
DATABASE_URL=postgresql://username:password@localhost:5432/weekly_planner

# Session configuration
SESSION_SECRET=your_secure_random_string

# Server configuration
PORT=3000
NODE_ENV=development
```

### Step 4: Set Up the Database

1. Create a PostgreSQL database:

```bash
createdb weekly_planner
```

2. Run database migrations:

```bash
npm run db:push
```

3. (Optional) Seed the database with initial data:

```bash
npm run db:seed
```

### Step 5: Start the Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:3000`.

## Production Deployment

### Option 1: Deploying on Replit

1. Fork the repository to your Replit account
2. Set up the required environment variables in Replit's Secrets tab:
   - `DATABASE_URL`
   - `SESSION_SECRET`
3. Click the "Run" button to start the application
4. For a permanent deployment, click the "Deploy" button in the Replit interface

### Option 2: Traditional Server Deployment

#### Prerequisites

- Node.js (v16.x or higher) installed on the server
- PostgreSQL database (can be on the same server or a separate database server)
- Nginx or another web server for proxying requests (recommended)

#### Step 1: Prepare the Application

1. Clone the repository on your server
2. Install production dependencies:

```bash
npm install --production
```

3. Build the client application:

```bash
npm run build
```

#### Step 2: Configure the Environment

Create a `.env` file with production settings:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/weekly_planner
SESSION_SECRET=your_secure_random_string
PORT=3000
NODE_ENV=production
```

#### Step 3: Set Up a Process Manager

Install PM2 to manage the Node.js process:

```bash
npm install -g pm2
pm2 start npm --name "weekly-planner" -- start
pm2 save
pm2 startup
```

#### Step 4: Configure Nginx as a Reverse Proxy

Create an Nginx configuration file in `/etc/nginx/sites-available/weekly-planner`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
ln -s /etc/nginx/sites-available/weekly-planner /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 5: Set Up SSL (Optional but Recommended)

Install Certbot and obtain an SSL certificate:

```bash
apt-get install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### Option 3: Docker Deployment

#### Prerequisites

- Docker and Docker Compose installed on the server

#### Step 1: Create a Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Step 2: Create a Docker Compose File

Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/weekly_planner
      - SESSION_SECRET=your_secure_random_string
      - NODE_ENV=production
    depends_on:
      - db
    restart: always

  db:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=weekly_planner
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Step 3: Deploy with Docker Compose

```bash
docker-compose up -d
```

## Database Backup and Restoration

### Creating a Backup

```bash
pg_dump -U postgres -d weekly_planner > backup.sql
```

### Restoring from a Backup

```bash
psql -U postgres -d weekly_planner < backup.sql
```

## System Maintenance

### Updating the Application

1. Pull the latest changes:

```bash
git pull origin main
```

2. Install any new dependencies:

```bash
npm install
```

3. Apply database migrations (if any):

```bash
npm run db:push
```

4. Rebuild the application (if needed):

```bash
npm run build
```

5. Restart the application:

```bash
# If using PM2
pm2 restart weekly-planner

# If using Docker
docker-compose restart
```

### Monitoring

For production environments, consider setting up monitoring:

- PM2 monitoring: `pm2 monit`
- Server monitoring with tools like Prometheus, Grafana, or Datadog
- Error tracking with Sentry or similar services

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check that PostgreSQL is running
   - Ensure network connectivity between application and database

2. **Application Won't Start**
   - Check logs: `npm run logs` or `pm2 logs`
   - Verify all environment variables are set
   - Ensure no process is already using the specified port

3. **Authentication Issues**
   - Check SESSION_SECRET is properly set
   - Verify cookie settings in the application
   - Clear browser cookies and try again

### Getting Help

If you encounter issues not covered here, please:

1. Check the GitHub issues page for similar problems
2. Consult the application logs for error messages
3. Contact the development team for support

## Security Considerations

- Regularly update dependencies: `npm audit fix`
- Ensure proper access controls on the database
- Use strong, unique passwords for all accounts
- Keep the SESSION_SECRET secure and unique
- Back up the database regularly
- Consider implementing rate limiting for authentication endpoints