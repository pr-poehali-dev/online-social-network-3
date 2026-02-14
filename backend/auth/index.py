import json
import hashlib
import os
import psycopg2
import uuid

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_user_by_token(token):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT u.id, u.username, u.email, u.display_name, u.bio, u.is_private, u.is_verified, u.is_artist, u.is_admin, u.is_blocked, u.block_count, u.telegram, u.instagram, u.website, u.tiktok, u.youtube, u.show_likes, u.show_reposts, u.show_followers, u.show_following, u.show_friends, u.allow_messages, u.theme FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = '%s'" % token.replace("'", "''"))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {
        'id': str(row[0]), 'username': row[1], 'email': row[2], 'display_name': row[3],
        'bio': row[4], 'is_private': row[5], 'is_verified': row[6], 'is_artist': row[7],
        'is_admin': row[8], 'is_blocked': row[9], 'block_count': row[10],
        'telegram': row[11], 'instagram': row[12], 'website': row[13],
        'tiktok': row[14], 'youtube': row[15], 'show_likes': row[16],
        'show_reposts': row[17], 'show_followers': row[18], 'show_following': row[19],
        'show_friends': row[20], 'allow_messages': row[21], 'theme': row[22]
    }

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token',
        'Content-Type': 'application/json'
    }

def handler(event, context):
    """Авторизация и регистрация пользователей соцсети Online"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('queryStringParameters', {}) or {}
    action = path.get('action', '')

    if method == 'POST':
        body = json.loads(event.get('body', '{}') or '{}')
        action = body.get('action', action)

        if action == 'register':
            return register(body)
        elif action == 'login':
            return login(body)
        elif action == 'logout':
            token = (event.get('headers', {}) or {}).get('X-Auth-Token', '')
            return logout(token)

    if method == 'GET' and action == 'me':
        token = (event.get('headers', {}) or {}).get('X-Auth-Token', '')
        if not token:
            return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Not authenticated'})}
        user = get_user_by_token(token)
        if not user:
            return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Invalid token'})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, url, is_primary FROM user_avatars WHERE user_id = '%s' ORDER BY is_primary DESC, created_at DESC" % user['id'])
        avatars = [{'id': str(r[0]), 'url': r[1], 'is_primary': r[2]} for r in cur.fetchall()]
        conn.close()
        user['avatars'] = avatars
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(user)}

    return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Unknown action'})}

def register(body):
    username = body.get('username', '').strip().lower()
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')

    if not username or not email or not password:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'All fields required'})}
    if len(username) < 3 or len(username) > 50:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Username must be 3-50 chars'})}
    if len(password) < 4:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Password too short'})}

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE username = '%s' OR email = '%s'" % (username.replace("'", "''"), email.replace("'", "''")))
    if cur.fetchone():
        conn.close()
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Username or email already taken'})}

    user_id = str(uuid.uuid4())
    token = str(uuid.uuid4())
    pw_hash = hash_password(password)

    cur.execute("INSERT INTO users (id, username, email, password_hash, display_name) VALUES ('%s', '%s', '%s', '%s', '%s')" % (user_id, username.replace("'", "''"), email.replace("'", "''"), pw_hash, username.replace("'", "''")))
    cur.execute("INSERT INTO sessions (user_id, token) VALUES ('%s', '%s')" % (user_id, token))
    conn.commit()
    conn.close()

    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'token': token, 'user': {'id': user_id, 'username': username, 'email': email, 'display_name': username}})}

def login(body):
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')

    if not email or not password:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Email and password required'})}

    conn = get_db()
    cur = conn.cursor()
    pw_hash = hash_password(password)
    cur.execute("SELECT id, username, email, display_name, is_blocked, is_admin, block_count FROM users WHERE email = '%s' AND password_hash = '%s'" % (email.replace("'", "''"), pw_hash))
    row = cur.fetchone()
    if not row:
        conn.close()
        return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Invalid credentials'})}

    user_id = str(row[0])
    is_blocked = row[4]
    block_count = row[6]

    if is_blocked:
        conn.close()
        return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'blocked', 'block_count': block_count})}

    token = str(uuid.uuid4())
    cur.execute("INSERT INTO sessions (user_id, token) VALUES ('%s', '%s')" % (user_id, token))
    conn.commit()
    conn.close()

    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'token': token, 'user': {'id': user_id, 'username': row[1], 'email': row[2], 'display_name': row[3], 'is_admin': row[5]}})}

def logout(token):
    if not token:
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE sessions SET token = 'expired_' || token WHERE token = '%s'" % token.replace("'", "''"))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}
