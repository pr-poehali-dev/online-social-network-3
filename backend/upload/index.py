import json
import os
import uuid
import base64
import boto3

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token',
        'Content-Type': 'application/json'
    }

def handler(event, context):
    """Загрузка файлов (аватарки, фото постов, сториз) в S3"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': cors_headers(), 'body': json.dumps({'error': 'POST only'})}

    body = json.loads(event.get('body', '{}') or '{}')
    file_data = body.get('file', '')
    file_type = body.get('type', 'image/jpeg')
    folder = body.get('folder', 'uploads')

    if not file_data:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'No file data'})}

    if ',' in file_data:
        file_data = file_data.split(',')[1]

    binary = base64.b64decode(file_data)
    ext = 'jpg'
    if 'png' in file_type:
        ext = 'png'
    elif 'gif' in file_type:
        ext = 'gif'
    elif 'webp' in file_type:
        ext = 'webp'
    elif 'mp4' in file_type:
        ext = 'mp4'

    filename = "%s/%s.%s" % (folder, str(uuid.uuid4()), ext)

    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    s3.put_object(Bucket='files', Key=filename, Body=binary, ContentType=file_type)

    cdn_url = "https://cdn.poehali.dev/projects/%s/bucket/%s" % (os.environ['AWS_ACCESS_KEY_ID'], filename)

    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'url': cdn_url})}
