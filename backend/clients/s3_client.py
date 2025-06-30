"""
AWS S3 client for file upload operations
Provides configurable client class to interact with AWS S3
"""
import logging
from typing import Optional, Dict, Any
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import mimetypes
import os
from nanoid import generate

logger = logging.getLogger(__name__)

class S3Client:
    """Configurable client for interacting with AWS S3"""
    
    def __init__(self, 
                 access_key_id: str, 
                 secret_access_key: str, 
                 region: str = "us-east-1",
                 bucket_name: str = ""):
        """
        Initialize S3 client with AWS credentials
        
        Args:
            access_key_id: AWS Access Key ID
            secret_access_key: AWS Secret Access Key
            region: AWS region (default: us-east-1)
            bucket_name: S3 bucket name
        """
        if not access_key_id or not secret_access_key:
            raise ValueError("AWS credentials are required")
        
        if not bucket_name:
            raise ValueError("S3 bucket name is required")
            
        self.bucket_name = bucket_name
        self.region = region
        
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                region_name=region
            )
            
            # Test connection by checking if bucket exists
            self.s3_client.head_bucket(Bucket=bucket_name)
            logger.info(f"S3 client initialized successfully for bucket: {bucket_name}")
            
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            raise ValueError("AWS credentials are invalid")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                logger.error(f"S3 bucket '{bucket_name}' not found")
                raise ValueError(f"S3 bucket '{bucket_name}' does not exist")
            else:
                logger.error(f"Failed to initialize S3 client: {e}")
                raise ValueError(f"Failed to connect to S3: {e}")
    
    async def upload_file(self, 
                         file_content: bytes,
                         file_name: str,
                         folder: str = "uploads",
                         content_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload file to S3 bucket
        
        Args:
            file_content: File content as bytes
            file_name: Original file name
            folder: S3 folder/prefix (default: uploads)
            content_type: MIME type of the file (auto-detected if not provided)
            
        Returns:
            Dict containing upload result with file URL and metadata
        """
        try:
            # Generate unique file name with nanoid
            file_extension = os.path.splitext(file_name)[1]
            unique_id = generate()  # Generate 21-character nanoid
            unique_file_name = f"{unique_id}{file_extension}"
            
            # Construct S3 key (path)
            s3_key = f"{folder}/{unique_file_name}" if folder else unique_file_name
            
            # Auto-detect content type if not provided
            if not content_type:
                content_type, _ = mimetypes.guess_type(file_name)
                if not content_type:
                    content_type = "application/octet-stream"
            
            # Upload file to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
            )
            
            # Construct file URL
            file_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{s3_key}"
            
            # Get file info
            file_size = len(file_content)
            
            logger.info(f"File uploaded successfully: {s3_key}")
            
            return {
                "success": True,
                "file_url": file_url,
                "s3_key": s3_key,
                "bucket": self.bucket_name,
                "original_name": file_name,
                "uploaded_name": unique_file_name,
                "content_type": content_type,
                "file_size": file_size,
                "folder": folder
            }
            
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error during S3 upload: {e}")
            raise e
    
    async def delete_file(self, s3_key: str) -> Dict[str, Any]:
        """
        Delete file from S3 bucket
        
        Args:
            s3_key: S3 object key (file path)
            
        Returns:
            Dict containing deletion result
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            logger.info(f"File deleted successfully: {s3_key}")
            
            return {
                "success": True,
                "message": f"File deleted successfully: {s3_key}",
                "s3_key": s3_key,
                "bucket": self.bucket_name
            }
            
        except ClientError as e:
            logger.error(f"Failed to delete file from S3: {e}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error during S3 deletion: {e}")
            raise e
    
    async def get_file_info(self, s3_key: str) -> Dict[str, Any]:
        """
        Get file information from S3
        
        Args:
            s3_key: S3 object key (file path)
            
        Returns:
            Dict containing file metadata
        """
        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            file_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{s3_key}"
            
            return {
                "success": True,
                "file_url": file_url,
                "s3_key": s3_key,
                "bucket": self.bucket_name,
                "content_type": response.get('ContentType'),
                "file_size": response.get('ContentLength'),
                "last_modified": response.get('LastModified'),
                "etag": response.get('ETag')
            }
            
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                logger.error(f"File not found in S3: {s3_key}")
                raise e
            else:
                logger.error(f"Failed to get file info from S3: {e}")
                raise e
        except Exception as e:
            logger.error(f"Unexpected error getting file info: {e}")
            raise e 