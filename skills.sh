#!/bin/bash
# ==============================================================================
# CAMPUS HIVE - One-Click Production Deployment Script (AWS EC2 / Ubuntu)
# ==============================================================================

# Exit on any error
set -e

echo "🚀 Starting Campus Hive Deployment..."

# 1. Update system
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install Docker & Docker Compose if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" -y
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Docker is ready!"

# 3. Create .env file for backend
echo "⚙️ Setting up Environment Variables..."

cd backend
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
DJANGO_SETTINGS_MODULE=campus_hive.settings
SECRET_KEY=django-insecure-production-key-replace-me-$(openssl rand -hex 16)
DEBUG=False
ALLOWED_HOSTS=*
DATABASE_URL=
GEMINI_API_KEY=
EOL
    echo "⚠️ .env file created in /backend. Please edit it to add your DATABASE_URL and GEMINI_API_KEY."
else
    echo "✅ .env file already exists."
fi
cd ..

# 4. Build and run the containers
echo "🏗️ Building and starting Docker containers..."
sudo docker-compose up -d --build

echo ""
echo "================================================================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "================================================================================="
echo "Your Campus Hive project is now running."
echo "Frontend: http://<EC2_PUBLIC_IP> (Port 80)"
echo "Backend:  http://<EC2_PUBLIC_IP>:8000"
echo ""
echo "⚠️ IMPORTANT NEXT STEPS:"
echo "1. Edit your backend/.env file to add your Supabase DATABASE_URL."
echo "   Run: nano backend/.env"
echo "2. Once edited, restart the backend:"
echo "   Run: sudo docker-compose restart backend"
echo "3. Ensure your EC2 Security Group allows inbound traffic on ports 80 and 8000."
echo "================================================================================="
