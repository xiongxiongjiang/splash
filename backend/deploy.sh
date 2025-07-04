#!/bin/bash

# Splash Backend Deployment Script
# This script builds and deploys the backend to AWS ECR/App Runner

set -e  # Exit on error

echo "🚀 Starting Splash Backend Deployment..."

# Function to validate environment variables
validate_env_vars() {
    echo "🔍 Validating environment variables..."
    
    # Read required variables from .env.local.template
    TEMPLATE_FILE=".env.local.template"
    if [ ! -f "$TEMPLATE_FILE" ]; then
        echo "❌ Error: $TEMPLATE_FILE not found"
        exit 1
    fi
    
    # Extract variable names from template (lines that contain = and don't start with #)
    REQUIRED_VARS=$(grep -E '^[^#]*=' "$TEMPLATE_FILE" | cut -d'=' -f1)
    
    # Check .env.local exists
    if [ ! -f ".env.local" ]; then
        echo "❌ Error: .env.local not found. Copy from .env.local.template and fill in values."
        exit 1
    fi
    
    # Check each required variable
    MISSING_VARS=""
    for var in $REQUIRED_VARS; do
        # Get value from .env.local
        value=$(grep "^$var=" .env.local 2>/dev/null | cut -d'=' -f2- | tr -d '"'"'"'')
        
        # Check if variable is missing or has placeholder value
        if [ -z "$value" ] || [[ "$value" == *"your_"* ]] || [[ "$value" == *"YOUR_"* ]]; then
            MISSING_VARS="$MISSING_VARS\n   - $var"
        fi
    done
    
    if [ -n "$MISSING_VARS" ]; then
        echo "❌ Error: Missing or incomplete environment variables in .env.local:"
        echo -e "$MISSING_VARS"
        echo ""
        echo "Please update .env.local with proper values before deploying."
        exit 1
    fi
    
    echo "✅ All environment variables validated"
}

# Validate environment variables first
validate_env_vars

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-2")
ECR_REPO="splash-backend"
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"

echo "📋 Deployment Configuration:"
echo "   AWS Account: $AWS_ACCOUNT_ID"
echo "   Region: $AWS_REGION"
echo "   ECR Repository: $ECR_URI"
echo ""

# Step 1: Login to ECR
echo "1️⃣ Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

# Step 2: Build Docker image for x86_64 (App Runner architecture)
echo "2️⃣ Building Docker image for x86_64..."
docker build --platform linux/amd64 -t $ECR_REPO .

# Step 3: Tag image for ECR
echo "3️⃣ Tagging image for ECR..."
docker tag $ECR_REPO:latest $ECR_URI:latest

# Step 4: Push to ECR
echo "4️⃣ Pushing image to ECR..."
docker push $ECR_URI:latest

# Step 5: Clean up untagged images in ECR
echo "5️⃣ Cleaning up untagged images in ECR..."
# First check if repository exists
if aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION &> /dev/null; then
    # Get untagged images
    UNTAGGED_IMAGES=$(aws ecr list-images --repository-name $ECR_REPO --region $AWS_REGION --filter tagStatus=UNTAGGED --query 'imageIds[*]' --output json)
    
    if [ "$UNTAGGED_IMAGES" != "[]" ] && [ "$UNTAGGED_IMAGES" != "null" ] && [ -n "$UNTAGGED_IMAGES" ]; then
        echo "   Found $(echo $UNTAGGED_IMAGES | jq '. | length') untagged image(s), deleting..."
        
        # Delete untagged images
        aws ecr batch-delete-image \
            --repository-name $ECR_REPO \
            --region $AWS_REGION \
            --image-ids "$UNTAGGED_IMAGES" \
            --output json > /dev/null
            
        echo "   ✅ Untagged images deleted"
    else
        echo "   ✅ No untagged images to delete"
    fi
else
    echo "   ℹ️  Repository doesn't exist yet (first deployment)"
fi

# Step 6: Update App Runner service
echo "6️⃣ Updating App Runner service..."
SERVICE_NAME="tally"

# Check if service exists
SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn | [0]" --output text 2>/dev/null)

if [ "$SERVICE_ARN" != "None" ] && [ -n "$SERVICE_ARN" ] && [ "$SERVICE_ARN" != "null" ]; then
    echo "   Found existing App Runner service"
    echo "   Updating service to use new image..."
    
    # Update the service with the new image
    aws apprunner update-service \
        --service-arn $SERVICE_ARN \
        --region $AWS_REGION \
        --source-configuration '{
            "ImageRepository": {
                "ImageIdentifier": "'$ECR_URI':latest",
                "ImageConfiguration": {
                    "Port": "8000"
                },
                "ImageRepositoryType": "ECR"
            },
            "AutoDeploymentsEnabled": false
        }' \
        --output text > /dev/null
    
    echo "   ✅ Service update initiated"
    
    # Also trigger a deployment to ensure the new image is deployed
    echo "   Starting deployment..."
    OPERATION_ID=$(aws apprunner start-deployment --service-arn $SERVICE_ARN --region $AWS_REGION --query OperationId --output text)
    echo "   ✅ Deployment started with Operation ID: $OPERATION_ID"
    echo ""
    echo "   📊 Monitor deployment progress at:"
    echo "   https://console.aws.amazon.com/apprunner/home?region=$AWS_REGION#/services/$SERVICE_NAME"
    
    # Get the service URL
    SERVICE_URL=$(aws apprunner describe-service --service-arn $SERVICE_ARN --region $AWS_REGION --query "Service.ServiceUrl" --output text)
    if [ -n "$SERVICE_URL" ] && [ "$SERVICE_URL" != "None" ]; then
        echo ""
        echo "   🌐 Service URL: https://$SERVICE_URL"
        echo "   📚 API Docs: https://$SERVICE_URL/docs"
        echo "   🏥 Health Check: https://$SERVICE_URL/health"
    fi
else
    echo "   ⚠️  No App Runner service found named '$SERVICE_NAME'"
    echo ""
    echo "   To create the service, run:"
    echo "   aws apprunner create-service \\"
    echo "     --service-name '$SERVICE_NAME' \\"
    echo "     --source-configuration '{"
    echo "       \"ImageRepository\": {"
    echo "         \"ImageIdentifier\": \"$ECR_URI:latest\","
    echo "         \"ImageConfiguration\": {"
    echo "           \"Port\": \"8000\","
    echo "           \"RuntimeEnvironmentVariables\": {"
    echo "             \"SUPABASE_URL\": \"https://your-project-id.supabase.co\","
    echo "             \"SUPABASE_SERVICE_ROLE_KEY\": \"YOUR_SUPABASE_SERVICE_ROLE_KEY\","
    echo "             \"SUPABASE_JWT_SECRET\": \"YOUR_SUPABASE_JWT_SECRET\","
    echo "             \"SUPABASE_AUDIENCE\": \"authenticated\","
    echo "             \"GEMINI_API_KEY\": \"YOUR_GEMINI_API_KEY\","
    echo "             \"ADMIN_USERNAME\": \"admin\","
    echo "             \"ADMIN_PASSWORD\": \"YOUR_ADMIN_PASSWORD\""
    echo "           }"
    echo "         },"
    echo "         \"ImageRepositoryType\": \"ECR\""
    echo "       },"
    echo "       \"AutoDeploymentsEnabled\": false"
    echo "     }'"
fi

echo ""
echo "✅ Deployment script completed!"
echo ""
echo "📝 Next steps:"
echo "   - Check the App Runner console for deployment status"
echo "   - Test the health endpoint: curl https://[your-app-url]/health"
echo "   - View API docs: https://[your-app-url]/docs"