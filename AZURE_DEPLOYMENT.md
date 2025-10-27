# OnScene EMS - Azure Deployment Guide

Complete guide for deploying the Whisper backend to Azure with HIPAA compliance.

## Prerequisites

1. **Azure Account** with active subscription
2. **Azure CLI** installed: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
3. **Docker** installed (for local testing)
4. **Git** repository setup (already done ✅)

## Part 1: Azure Setup (One-Time)

### Step 1: Install Azure CLI

```bash
# Windows (PowerShell as Administrator)
winget install -e --id Microsoft.AzureCLI

# Verify installation
az --version
```

### Step 2: Login to Azure

```powershell
az login
```

### Step 3: Create Resource Group

```powershell
# Set variables
$RESOURCE_GROUP="onscene-ems-resources"
$LOCATION="eastus"  # Choose region close to your users
$APP_NAME="onscene-whisper"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION
```

### Step 4: Sign Business Associate Agreement (BAA)

**CRITICAL for HIPAA Compliance:**

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to **Microsoft Trust Center**
3. Sign the **Business Associate Agreement (BAA)**
4. Enable **HIPAA/HITRUST** compliance for your subscription

📝 Documentation: https://docs.microsoft.com/en-us/azure/compliance/offerings/offering-hipaa-us

## Part 2: Container Registry Setup

### Step 5: Create Azure Container Registry

```powershell
$ACR_NAME="onsceneregistry"  # Must be globally unique, lowercase, no hyphens

# Create container registry
az acr create `
  --resource-group $RESOURCE_GROUP `
  --name $ACR_NAME `
  --sku Basic `
  --admin-enabled true

# Get ACR credentials
az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP
```

**Save the credentials** - you'll need them later!

## Part 3: Build and Push Docker Image

### Step 6: Build Docker Image Locally

```powershell
cd whisper_service

# Build image
docker build -t onscene-whisper:latest .

# Test locally (optional)
docker run -p 5000:5000 -e ENVIRONMENT=development onscene-whisper:latest
# Test: http://localhost:5000/health
```

### Step 7: Push to Azure Container Registry

```powershell
# Login to ACR
az acr login --name $ACR_NAME

# Tag image
docker tag onscene-whisper:latest ${ACR_NAME}.azurecr.io/onscene-whisper:latest

# Push image
docker push ${ACR_NAME}.azurecr.io/onscene-whisper:latest
```

## Part 4: Deploy to Azure Container Instances

### Step 8: Generate API Key

```powershell
# Generate secure API key
python -c "import secrets; print('WHISPER_API_KEY=' + secrets.token_urlsafe(32))"
```

**Save this API key** - you'll need it in your mobile app!

### Step 9: Deploy Container

```powershell
$API_KEY="your-generated-api-key-here"  # From Step 8

# Get ACR credentials
$ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
$ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

# Deploy container
az container create `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --image ${ACR_NAME}.azurecr.io/onscene-whisper:latest `
  --registry-login-server ${ACR_NAME}.azurecr.io `
  --registry-username $ACR_USERNAME `
  --registry-password $ACR_PASSWORD `
  --dns-name-label $APP_NAME `
  --ports 5000 `
  --cpu 2 `
  --memory 4 `
  --environment-variables `
    ENVIRONMENT=production `
    WHISPER_API_KEY=$API_KEY `
    MAX_FILE_SIZE_MB=25 `
  --restart-policy Always
```

### Step 10: Get Your Service URL

```powershell
# Get the FQDN
az container show `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --query ipAddress.fqdn `
  --output tsv
```

Your service URL will be: `http://your-app-name.eastus.azurecontainer.io:5000`

### Step 11: Test Deployment

```powershell
# Health check
curl http://your-service-url:5000/health

# Expected response:
# {"status":"healthy","service":"OnScene EMS Whisper Service",...}
```

## Part 5: Enable HTTPS (Required for Production)

### Step 12: Setup Azure Application Gateway (for HTTPS)

```powershell
# Create public IP
az network public-ip create `
  --resource-group $RESOURCE_GROUP `
  --name onscene-gateway-ip `
  --allocation-method Static `
  --sku Standard

# Create Application Gateway (this provisions SSL)
# This is more advanced - follow Azure docs:
# https://docs.microsoft.com/en-us/azure/application-gateway/
```

**Alternative (Easier):** Use Azure App Service instead of Container Instances (comes with free SSL)

## Part 6: Update Mobile App

### Step 13: Update React Native App

Edit `src/services/whisperService.js`:

```javascript
// Update this line:
const WHISPER_BASE_URL = 'https://your-service-url.azurewebsites.net';

// Add API key
const API_KEY = 'your-generated-api-key';

// Update transcribe method to include auth header:
headers: {
  'Authorization': `Bearer ${API_KEY}`,
  // ... other headers
}
```

## Part 7: HIPAA Compliance Checklist

✅ **Encryption in Transit**: Use HTTPS (Step 12)
✅ **Encryption at Rest**: Azure encrypts by default
✅ **Access Controls**: API key authentication (Step 8)
✅ **Audit Logging**: Built into app.py
✅ **Data Minimization**: Audio deleted after transcription
✅ **BAA Signed**: Completed in Step 4

### Additional HIPAA Requirements:

1. **Enable Azure Monitor** for audit log storage
2. **Set up alerts** for unauthorized access attempts
3. **Configure backup and disaster recovery**
4. **Document security procedures**
5. **Train all users** on HIPAA compliance

## Cost Estimate

**Azure Container Instances:**
- 2 vCPU, 4GB RAM: ~$60/month
- Bandwidth: ~$10/month
- Total: **~$70/month**

**Alternative - Azure App Service:**
- B2 tier (2 cores, 3.5GB): ~$55/month
- Includes free SSL/HTTPS
- Total: **~$55/month**

## Monitoring and Maintenance

### View Logs

```powershell
# Real-time logs
az container logs `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --follow
```

### Update Deployment

```powershell
# Rebuild and push new image
docker build -t onscene-whisper:latest .
docker tag onscene-whisper:latest ${ACR_NAME}.azurecr.io/onscene-whisper:latest
docker push ${ACR_NAME}.azurecr.io/onscene-whisper:latest

# Restart container (pulls latest image)
az container restart `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME
```

### Scale Up/Down

```powershell
# Update resources
az container create `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --cpu 4 `
  --memory 8 `
  # ... other parameters same as Step 9
```

## Troubleshooting

### Container won't start

```powershell
# Check container state
az container show `
  --resource-group $RESOURCE_GROUP `
  --name $APP_NAME `
  --query instanceView.state

# View detailed logs
az container logs --resource-group $RESOURCE_GROUP --name $APP_NAME
```

### Out of Memory

Increase memory allocation or switch to smaller Whisper model

### Slow transcription

Upgrade to more CPUs or consider GPU-enabled Azure instances

## Support

- Azure Support: https://azure.microsoft.com/support
- OnScene EMS Issues: [Your GitHub Issues URL]
- HIPAA Compliance: https://www.hhs.gov/hipaa

---

**🎉 Deployment Complete!**

Your HIPAA-compliant Whisper service is now running on Azure!

Next steps:
1. Update mobile app with new URL and API key
2. Test end-to-end from mobile device
3. Set up monitoring and alerts
4. Deploy v1.0 to App Store / Play Store! 🚀
