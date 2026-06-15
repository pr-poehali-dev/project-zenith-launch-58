import json
import os
import uuid
import base64
import psycopg2
import boto3

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def handler(event: dict, context) -> dict:
    """Управление фото галереи NARGIZA: получение, загрузка, удаление."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod')
    path = event.get('path', '')

    # GET /gallery — список всех фото
    if method == 'GET':
        conn = get_db()
        cur = conn.cursor()
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        cur.execute(f'SELECT id, url, created_at FROM {schema}.gallery_photos ORDER BY created_at DESC')
        rows = cur.fetchall()
        cur.close()
        conn.close()
        photos = [{'id': r[0], 'url': r[1], 'created_at': str(r[2])} for r in rows]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'photos': photos})}

    # POST /gallery — загрузить фото (base64)
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        password = body.get('password', '')
        if password != os.environ.get('ADMIN_PASSWORD', ''):
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный пароль'})}

        image_data = body.get('image', '')
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        content_type = body.get('content_type', 'image/jpeg')
        ext = content_type.split('/')[-1].replace('jpeg', 'jpg')
        key = f'gallery/{uuid.uuid4()}.{ext}'

        s3 = get_s3()
        s3.put_object(
            Bucket='files',
            Key=key,
            Body=base64.b64decode(image_data),
            ContentType=content_type,
        )
        url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        conn = get_db()
        cur = conn.cursor()
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        cur.execute(f'INSERT INTO {schema}.gallery_photos (url) VALUES (%s) RETURNING id', (url,))
        photo_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'id': photo_id, 'url': url})}

    # DELETE /gallery?id=123
    if method == 'DELETE':
        body = json.loads(event.get('body') or '{}')
        password = body.get('password', '')
        if password != os.environ.get('ADMIN_PASSWORD', ''):
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный пароль'})}

        photo_id = body.get('id')
        conn = get_db()
        cur = conn.cursor()
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        cur.execute(f'SELECT url FROM {schema}.gallery_photos WHERE id = %s', (photo_id,))
        row = cur.fetchone()
        if row:
            cur.execute(f'DELETE FROM {schema}.gallery_photos WHERE id = %s', (photo_id,))
            conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}
