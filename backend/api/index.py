import json
import os
import psycopg2
import uuid

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token',
        'Content-Type': 'application/json'
    }

def get_user_by_token(headers):
    token = (headers or {}).get('X-Auth-Token', '')
    if not token:
        return None
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, username, is_admin, is_blocked FROM users WHERE id = (SELECT user_id FROM sessions WHERE token = '%s')" % token.replace("'", "''"))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {'id': str(row[0]), 'username': row[1], 'is_admin': row[2], 'is_blocked': row[3]}

def handler(event, context):
    """Основное API соцсети Online: посты, лайки, комментарии, подписки, профили"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', '')
    headers = event.get('headers', {}) or {}
    user = get_user_by_token(headers)

    if method == 'GET':
        if action == 'feed':
            return get_feed(params, user)
        elif action == 'post':
            return get_post(params, user)
        elif action == 'profile':
            return get_profile(params, user)
        elif action == 'comments':
            return get_comments(params, user)
        elif action == 'search':
            return search_users(params, user)
        elif action == 'followers':
            return get_followers(params, user)
        elif action == 'following':
            return get_following(params, user)
        elif action == 'friends':
            return get_friends(params, user)
        elif action == 'stories':
            return get_stories(user)
        elif action == 'notifications':
            return get_notifications(user)
        elif action == 'messages':
            return get_messages(params, user)
        elif action == 'conversation':
            return get_conversation(params, user)
        elif action == 'user_posts':
            return get_user_posts(params, user)
        elif action == 'user_likes':
            return get_user_likes(params, user)
        elif action == 'user_reposts':
            return get_user_reposts(params, user)

    if method == 'POST':
        body = json.loads(event.get('body', '{}') or '{}')
        act = body.get('action', '')

        if not user:
            return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Auth required'})}

        if act == 'create_post':
            return create_post(body, user)
        elif act == 'like_post':
            return like_post(body, user)
        elif act == 'unlike_post':
            return unlike_post(body, user)
        elif act == 'comment':
            return add_comment(body, user)
        elif act == 'like_comment':
            return like_comment(body, user)
        elif act == 'unlike_comment':
            return unlike_comment(body, user)
        elif act == 'follow':
            return follow_user(body, user)
        elif act == 'unfollow':
            return unfollow_user(body, user)
        elif act == 'repost':
            return repost(body, user)
        elif act == 'unrepost':
            return unrepost(body, user)
        elif act == 'hide_post':
            return hide_post(body, user)
        elif act == 'hide_comment':
            return hide_comment(body, user)
        elif act == 'update_profile':
            return update_profile(body, user)
        elif act == 'send_message':
            return send_message(body, user)
        elif act == 'edit_message':
            return edit_message(body, user)
        elif act == 'pin_message':
            return pin_message(body, user)
        elif act == 'mark_read':
            return mark_read(body, user)
        elif act == 'create_story':
            return create_story(body, user)
        elif act == 'block_user':
            return block_user(body, user)
        elif act == 'unblock_user':
            return unblock_user(body, user)
        elif act == 'report':
            return create_report(body, user)
        elif act == 'request_verification':
            return request_verification(body, user)
        elif act == 'view_post':
            return view_post(body, user)
        elif act == 'accept_follow':
            return accept_follow(body, user)
        elif act == 'reject_follow':
            return reject_follow(body, user)
        elif act == 'appeal':
            return create_appeal(body, user)
        elif act == 'delete_account':
            return delete_account(user)
        elif act == 'upload_avatar':
            return upload_avatar(body, user)
        elif act == 'remove_avatar':
            return remove_avatar(body, user)
        elif act == 'set_primary_avatar':
            return set_primary_avatar(body, user)
        elif act == 'read_notifications':
            return read_notifications(user)

        if user.get('is_admin'):
            if act == 'admin_verify':
                return admin_verify(body)
            elif act == 'admin_reject_verify':
                return admin_reject_verify(body)
            elif act == 'admin_block_user':
                return admin_block_user(body)
            elif act == 'admin_unblock_user':
                return admin_unblock_user(body)
            elif act == 'admin_hide_post':
                return admin_hide_post(body)
            elif act == 'admin_resolve_report':
                return admin_resolve_report(body)
            elif act == 'admin_resolve_appeal':
                return admin_resolve_appeal(body)
            elif act == 'admin_get_reports':
                return admin_get_reports()
            elif act == 'admin_get_verifications':
                return admin_get_verifications()
            elif act == 'admin_get_appeals':
                return admin_get_appeals()
            elif act == 'admin_add_release':
                return admin_add_release(body)

    return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Unknown action'})}


def get_feed(params, user):
    conn = get_db()
    cur = conn.cursor()
    offset = int(params.get('offset', '0'))
    blocked_clause = ""
    if user:
        cur.execute("SELECT blocked_id FROM blocks WHERE blocker_id = '%s'" % user['id'])
        blocked = [str(r[0]) for r in cur.fetchall()]
        if blocked:
            blocked_clause = " AND p.user_id NOT IN (%s)" % ','.join(["'%s'" % b for b in blocked])
    cur.execute("""SELECT p.id, p.content, p.image_url, p.views_count, p.created_at,
        u.id, u.username, u.display_name, u.is_verified, u.is_artist,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id),
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_hidden = FALSE),
        (SELECT COUNT(*) FROM reposts WHERE post_id = p.id)
        FROM posts p JOIN users u ON p.user_id = u.id
        WHERE p.is_hidden = FALSE AND u.is_blocked = FALSE %s
        ORDER BY p.created_at DESC LIMIT 20 OFFSET %d""" % (blocked_clause, offset))
    posts = []
    for r in cur.fetchall():
        post = {
            'id': str(r[0]), 'content': r[1], 'image_url': r[2], 'views_count': r[3],
            'created_at': r[4].isoformat() if r[4] else None,
            'user': {'id': str(r[5]), 'username': r[6], 'display_name': r[7], 'is_verified': r[8], 'is_artist': r[9]},
            'likes_count': r[10], 'comments_count': r[11], 'reposts_count': r[12],
            'liked': False, 'reposted': False
        }
        if user:
            cur.execute("SELECT id FROM post_likes WHERE user_id = '%s' AND post_id = '%s'" % (user['id'], post['id']))
            post['liked'] = cur.fetchone() is not None
            cur.execute("SELECT id FROM reposts WHERE user_id = '%s' AND post_id = '%s'" % (user['id'], post['id']))
            post['reposted'] = cur.fetchone() is not None
        cur.execute("SELECT id, url, is_primary FROM user_avatars WHERE user_id = '%s' AND is_primary = TRUE LIMIT 1" % post['user']['id'])
        av = cur.fetchone()
        post['user']['avatar'] = av[1] if av else None
        posts.append(post)
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(posts, default=str)}


def get_post(params, user):
    post_id = params.get('id', '')
    if not post_id:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Post ID required'})}
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT p.id, p.content, p.image_url, p.views_count, p.created_at,
        u.id, u.username, u.display_name, u.is_verified, u.is_artist,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id),
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_hidden = FALSE),
        (SELECT COUNT(*) FROM reposts WHERE post_id = p.id)
        FROM posts p JOIN users u ON p.user_id = u.id
        WHERE p.id = '%s' AND p.is_hidden = FALSE""" % post_id.replace("'", "''"))
    r = cur.fetchone()
    if not r:
        conn.close()
        return {'statusCode': 404, 'headers': cors_headers(), 'body': json.dumps({'error': 'Post not found'})}
    post = {
        'id': str(r[0]), 'content': r[1], 'image_url': r[2], 'views_count': r[3],
        'created_at': r[4].isoformat() if r[4] else None,
        'user': {'id': str(r[5]), 'username': r[6], 'display_name': r[7], 'is_verified': r[8], 'is_artist': r[9]},
        'likes_count': r[10], 'comments_count': r[11], 'reposts_count': r[12],
        'liked': False, 'reposted': False
    }
    if user:
        cur.execute("SELECT id FROM post_likes WHERE user_id = '%s' AND post_id = '%s'" % (user['id'], post['id']))
        post['liked'] = cur.fetchone() is not None
        cur.execute("SELECT id FROM reposts WHERE user_id = '%s' AND post_id = '%s'" % (user['id'], post['id']))
        post['reposted'] = cur.fetchone() is not None
    cur.execute("SELECT id, url FROM user_avatars WHERE user_id = '%s' AND is_primary = TRUE LIMIT 1" % post['user']['id'])
    av = cur.fetchone()
    post['user']['avatar'] = av[1] if av else None
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(post, default=str)}


def get_profile(params, user):
    username = params.get('username', '')
    if not username:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Username required'})}
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, username, email, display_name, bio, is_private, is_verified, is_artist, is_admin, is_blocked, telegram, instagram, website, tiktok, youtube, show_likes, show_reposts, show_followers, show_following, show_friends, created_at FROM users WHERE username = '%s'" % username.replace("'", "''"))
    r = cur.fetchone()
    if not r:
        conn.close()
        return {'statusCode': 404, 'headers': cors_headers(), 'body': json.dumps({'error': 'User not found'})}
    uid = str(r[0])
    profile = {
        'id': uid, 'username': r[1], 'email': r[2], 'display_name': r[3], 'bio': r[4],
        'is_private': r[5], 'is_verified': r[6], 'is_artist': r[7], 'is_admin': r[8], 'is_blocked': r[9],
        'telegram': r[10], 'instagram': r[11], 'website': r[12], 'tiktok': r[13], 'youtube': r[14],
        'show_likes': r[15], 'show_reposts': r[16], 'show_followers': r[17], 'show_following': r[18], 'show_friends': r[19],
        'created_at': r[20].isoformat() if r[20] else None
    }
    cur.execute("SELECT COUNT(*) FROM follows WHERE following_id = '%s' AND status = 'accepted'" % uid)
    profile['followers_count'] = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM follows WHERE follower_id = '%s' AND status = 'accepted'" % uid)
    profile['following_count'] = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM posts WHERE user_id = '%s' AND is_hidden = FALSE" % uid)
    profile['posts_count'] = cur.fetchone()[0]
    cur.execute("SELECT id, url, is_primary FROM user_avatars WHERE user_id = '%s' ORDER BY is_primary DESC, created_at DESC" % uid)
    profile['avatars'] = [{'id': str(a[0]), 'url': a[1], 'is_primary': a[2]} for a in cur.fetchall()]
    profile['is_following'] = False
    profile['follow_status'] = None
    if user and user['id'] != uid:
        cur.execute("SELECT status FROM follows WHERE follower_id = '%s' AND following_id = '%s'" % (user['id'], uid))
        fr = cur.fetchone()
        if fr:
            profile['follow_status'] = fr[0]
            profile['is_following'] = fr[0] == 'accepted'
    if r[7]:
        cur.execute("SELECT id, title, artist_name, cover_url, audio_url, created_at FROM releases WHERE artist_id = '%s' ORDER BY created_at DESC" % uid)
        profile['releases'] = [{'id': str(x[0]), 'title': x[1], 'artist_name': x[2], 'cover_url': x[3], 'audio_url': x[4], 'created_at': x[5].isoformat() if x[5] else None} for x in cur.fetchall()]
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(profile, default=str)}


def get_comments(params, user):
    post_id = params.get('post_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT c.id, c.content, c.parent_id, c.created_at,
        u.id, u.username, u.display_name, u.is_verified, u.is_artist,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id),
        p.user_id
        FROM comments c JOIN users u ON c.user_id = u.id JOIN posts p ON c.post_id = p.id
        WHERE c.post_id = '%s' AND c.is_hidden = FALSE
        ORDER BY c.created_at ASC""" % post_id.replace("'", "''"))
    comments = []
    for r in cur.fetchall():
        c = {
            'id': str(r[0]), 'content': r[1], 'parent_id': str(r[2]) if r[2] else None,
            'created_at': r[3].isoformat() if r[3] else None,
            'user': {'id': str(r[4]), 'username': r[5], 'display_name': r[6], 'is_verified': r[7], 'is_artist': r[8]},
            'likes_count': r[9], 'is_author_like': False, 'liked': False
        }
        post_author_id = str(r[10])
        cur.execute("SELECT id FROM comment_likes WHERE comment_id = '%s' AND user_id = '%s'" % (c['id'], post_author_id))
        c['is_author_like'] = cur.fetchone() is not None
        if user:
            cur.execute("SELECT id FROM comment_likes WHERE comment_id = '%s' AND user_id = '%s'" % (c['id'], user['id']))
            c['liked'] = cur.fetchone() is not None
        cur.execute("SELECT id, url FROM user_avatars WHERE user_id = '%s' AND is_primary = TRUE LIMIT 1" % c['user']['id'])
        av = cur.fetchone()
        c['user']['avatar'] = av[1] if av else None
        comments.append(c)
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(comments, default=str)}


def search_users(params, user):
    q = params.get('q', '').strip()
    if not q or len(q) < 2:
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps([])}
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, username, display_name, is_verified, is_artist, bio FROM users WHERE (username ILIKE '%%%s%%' OR display_name ILIKE '%%%s%%') AND is_blocked = FALSE LIMIT 20" % (q.replace("'", "''"), q.replace("'", "''")))
    results = []
    for r in cur.fetchall():
        u = {'id': str(r[0]), 'username': r[1], 'display_name': r[2], 'is_verified': r[3], 'is_artist': r[4], 'bio': r[5]}
        cur.execute("SELECT url FROM user_avatars WHERE user_id = '%s' AND is_primary = TRUE LIMIT 1" % u['id'])
        av = cur.fetchone()
        u['avatar'] = av[0] if av else None
        results.append(u)
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(results)}


def create_post(body, user):
    content = body.get('content', '').strip()
    image_url = body.get('image_url', '')
    if not content and not image_url:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Content or image required'})}
    conn = get_db()
    cur = conn.cursor()
    post_id = str(uuid.uuid4())
    cur.execute("INSERT INTO posts (id, user_id, content, image_url) VALUES ('%s', '%s', '%s', '%s')" % (post_id, user['id'], content.replace("'", "''"), (image_url or '').replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'id': post_id})}


def like_post(body, user):
    post_id = body.get('post_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM post_likes WHERE user_id = '%s' AND post_id = '%s'" % (user['id'], post_id.replace("'", "''")))
    if cur.fetchone():
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}
    cur.execute("INSERT INTO post_likes (user_id, post_id) VALUES ('%s', '%s')" % (user['id'], post_id.replace("'", "''")))
    cur.execute("SELECT user_id FROM posts WHERE id = '%s'" % post_id.replace("'", "''"))
    post_owner = cur.fetchone()
    if post_owner and str(post_owner[0]) != user['id']:
        cur.execute("INSERT INTO notifications (user_id, type, from_user_id, post_id, content) VALUES ('%s', 'like', '%s', '%s', 'liked your post')" % (str(post_owner[0]), user['id'], post_id.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def unlike_post(body, user):
    post_id = body.get('post_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE post_likes SET post_id = post_id WHERE user_id = '%s' AND post_id = '%s'" % (user['id'], post_id.replace("'", "''")))
    cur.execute("SELECT id FROM post_likes WHERE user_id = '%s' AND post_id = '%s'" % (user['id'], post_id.replace("'", "''")))
    row = cur.fetchone()
    if row:
        lid = str(row[0])
        cur.execute("UPDATE post_likes SET user_id = '00000000-0000-0000-0000-000000000000' WHERE id = '%s'" % lid)
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def add_comment(body, user):
    post_id = body.get('post_id', '')
    content = body.get('content', '').strip()
    parent_id = body.get('parent_id', None)
    if not content:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Content required'})}
    conn = get_db()
    cur = conn.cursor()
    cid = str(uuid.uuid4())
    parent_sql = "'%s'" % parent_id if parent_id else "NULL"
    cur.execute("INSERT INTO comments (id, post_id, user_id, parent_id, content) VALUES ('%s', '%s', '%s', %s, '%s')" % (cid, post_id.replace("'", "''"), user['id'], parent_sql, content.replace("'", "''")))
    cur.execute("SELECT user_id FROM posts WHERE id = '%s'" % post_id.replace("'", "''"))
    post_owner = cur.fetchone()
    if post_owner and str(post_owner[0]) != user['id']:
        cur.execute("INSERT INTO notifications (user_id, type, from_user_id, post_id, content) VALUES ('%s', 'comment', '%s', '%s', '%s')" % (str(post_owner[0]), user['id'], post_id.replace("'", "''"), content.replace("'", "''")[:100]))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'id': cid})}


def like_comment(body, user):
    comment_id = body.get('comment_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM comment_likes WHERE user_id = '%s' AND comment_id = '%s'" % (user['id'], comment_id.replace("'", "''")))
    if cur.fetchone():
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}
    cur.execute("INSERT INTO comment_likes (user_id, comment_id) VALUES ('%s', '%s')" % (user['id'], comment_id.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def unlike_comment(body, user):
    comment_id = body.get('comment_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM comment_likes WHERE user_id = '%s' AND comment_id = '%s'" % (user['id'], comment_id.replace("'", "''")))
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE comment_likes SET user_id = '00000000-0000-0000-0000-000000000000' WHERE id = '%s'" % str(row[0]))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def follow_user(body, user):
    target_id = body.get('user_id', '')
    if target_id == user['id']:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Cannot follow yourself'})}
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, status FROM follows WHERE follower_id = '%s' AND following_id = '%s'" % (user['id'], target_id.replace("'", "''")))
    existing = cur.fetchone()
    if existing:
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'status': existing[1]})}
    cur.execute("SELECT is_private FROM users WHERE id = '%s'" % target_id.replace("'", "''"))
    target = cur.fetchone()
    status = 'pending' if target and target[0] else 'accepted'
    cur.execute("INSERT INTO follows (follower_id, following_id, status) VALUES ('%s', '%s', '%s')" % (user['id'], target_id.replace("'", "''"), status))
    ntype = 'follow_request' if status == 'pending' else 'follow'
    cur.execute("INSERT INTO notifications (user_id, type, from_user_id, content) VALUES ('%s', '%s', '%s', '%s')" % (target_id.replace("'", "''"), ntype, user['id'], 'wants to follow you' if status == 'pending' else 'started following you'))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'status': status})}


def unfollow_user(body, user):
    target_id = body.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM follows WHERE follower_id = '%s' AND following_id = '%s'" % (user['id'], target_id.replace("'", "''")))
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE follows SET status = 'removed' WHERE id = '%s'" % str(row[0]))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def accept_follow(body, user):
    follower_id = body.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE follows SET status = 'accepted' WHERE follower_id = '%s' AND following_id = '%s' AND status = 'pending'" % (follower_id.replace("'", "''"), user['id']))
    cur.execute("INSERT INTO notifications (user_id, type, from_user_id, content) VALUES ('%s', 'follow_accepted', '%s', 'accepted your follow request')" % (follower_id.replace("'", "''"), user['id']))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def reject_follow(body, user):
    follower_id = body.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE follows SET status = 'rejected' WHERE follower_id = '%s' AND following_id = '%s' AND status = 'pending'" % (follower_id.replace("'", "''"), user['id']))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def repost(body, user):
    post_id = body.get('post_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM reposts WHERE user_id = '%s' AND post_id = '%s'" % (user['id'], post_id.replace("'", "''")))
    if cur.fetchone():
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}
    cur.execute("INSERT INTO reposts (user_id, post_id) VALUES ('%s', '%s')" % (user['id'], post_id.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def unrepost(body, user):
    post_id = body.get('post_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM reposts WHERE user_id = '%s' AND post_id = '%s'" % (user['id'], post_id.replace("'", "''")))
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE reposts SET user_id = '00000000-0000-0000-0000-000000000000' WHERE id = '%s'" % str(row[0]))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def hide_post(body, user):
    post_id = body.get('post_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE posts SET is_hidden = TRUE WHERE id = '%s' AND user_id = '%s'" % (post_id.replace("'", "''"), user['id']))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def hide_comment(body, user):
    comment_id = body.get('comment_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT c.id FROM comments c JOIN posts p ON c.post_id = p.id WHERE c.id = '%s' AND (c.user_id = '%s' OR p.user_id = '%s')" % (comment_id.replace("'", "''"), user['id'], user['id']))
    if cur.fetchone():
        cur.execute("UPDATE comments SET is_hidden = TRUE WHERE id = '%s'" % comment_id.replace("'", "''"))
        conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def update_profile(body, user):
    conn = get_db()
    cur = conn.cursor()
    fields = []
    for f in ['display_name', 'bio', 'telegram', 'instagram', 'website', 'tiktok', 'youtube', 'show_likes', 'show_reposts', 'show_followers', 'show_following', 'show_friends', 'theme']:
        if f in body:
            fields.append("%s = '%s'" % (f, str(body[f]).replace("'", "''")))
    if 'is_private' in body:
        fields.append("is_private = %s" % ('TRUE' if body['is_private'] else 'FALSE'))
    if 'allow_messages' in body:
        fields.append("allow_messages = %s" % ('TRUE' if body['allow_messages'] else 'FALSE'))
    if fields:
        cur.execute("UPDATE users SET %s WHERE id = '%s'" % (', '.join(fields), user['id']))
        conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def send_message(body, user):
    receiver_id = body.get('receiver_id', '')
    content = body.get('content', '').strip()
    reply_to_id = body.get('reply_to_id', None)
    if not content:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Content required'})}
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT allow_messages FROM users WHERE id = '%s'" % receiver_id.replace("'", "''"))
    rec = cur.fetchone()
    if rec and not rec[0]:
        conn.close()
        return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'User disabled messages'})}
    cur.execute("SELECT id FROM blocks WHERE blocker_id = '%s' AND blocked_id = '%s'" % (receiver_id.replace("'", "''"), user['id']))
    if cur.fetchone():
        conn.close()
        return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Blocked'})}
    mid = str(uuid.uuid4())
    reply_sql = "'%s'" % reply_to_id if reply_to_id else "NULL"
    cur.execute("INSERT INTO messages (id, sender_id, receiver_id, content, reply_to_id) VALUES ('%s', '%s', '%s', '%s', %s)" % (mid, user['id'], receiver_id.replace("'", "''"), content.replace("'", "''"), reply_sql))
    cur.execute("INSERT INTO notifications (user_id, type, from_user_id, content) VALUES ('%s', 'message', '%s', '%s')" % (receiver_id.replace("'", "''"), user['id'], content.replace("'", "''")[:50]))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'id': mid})}


def edit_message(body, user):
    msg_id = body.get('message_id', '')
    content = body.get('content', '').strip()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE messages SET content = '%s', edited_at = NOW() WHERE id = '%s' AND sender_id = '%s'" % (content.replace("'", "''"), msg_id.replace("'", "''"), user['id']))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def pin_message(body, user):
    msg_id = body.get('message_id', '')
    pinned = body.get('pinned', True)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE messages SET is_pinned = %s WHERE id = '%s' AND (sender_id = '%s' OR receiver_id = '%s')" % ('TRUE' if pinned else 'FALSE', msg_id.replace("'", "''"), user['id'], user['id']))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def mark_read(body, user):
    sender_id = body.get('sender_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE messages SET is_read = TRUE WHERE sender_id = '%s' AND receiver_id = '%s' AND is_read = FALSE" % (sender_id.replace("'", "''"), user['id']))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def get_messages(params, user):
    if not user:
        return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Auth required'})}
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT DISTINCT ON (partner_id) partner_id, content, created_at, is_read, sender_id FROM (
        SELECT CASE WHEN sender_id = '%s' THEN receiver_id ELSE sender_id END as partner_id,
        content, created_at, is_read, sender_id
        FROM messages WHERE (sender_id = '%s' AND hidden_by_sender = FALSE) OR (receiver_id = '%s' AND hidden_by_receiver = FALSE)
        ORDER BY partner_id, created_at DESC
    ) sub""" % (user['id'], user['id'], user['id']))
    chats = []
    for r in cur.fetchall():
        pid = str(r[0])
        cur.execute("SELECT username, display_name, is_verified, is_artist FROM users WHERE id = '%s'" % pid)
        u = cur.fetchone()
        if not u:
            continue
        cur.execute("SELECT url FROM user_avatars WHERE user_id = '%s' AND is_primary = TRUE LIMIT 1" % pid)
        av = cur.fetchone()
        cur.execute("SELECT COUNT(*) FROM messages WHERE sender_id = '%s' AND receiver_id = '%s' AND is_read = FALSE" % (pid, user['id']))
        unread = cur.fetchone()[0]
        chats.append({
            'partner_id': pid, 'username': u[0], 'display_name': u[1], 'is_verified': u[2], 'is_artist': u[3],
            'avatar': av[0] if av else None, 'last_message': r[1], 'last_time': r[2].isoformat() if r[2] else None,
            'unread': unread
        })
    conn.close()
    chats.sort(key=lambda x: x['last_time'] or '', reverse=True)
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(chats, default=str)}


def get_conversation(params, user):
    if not user:
        return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Auth required'})}
    partner_id = params.get('partner_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT id, sender_id, receiver_id, content, reply_to_id, is_read, is_pinned, edited_at, created_at
        FROM messages
        WHERE ((sender_id = '%s' AND receiver_id = '%s' AND hidden_by_sender = FALSE) OR (sender_id = '%s' AND receiver_id = '%s' AND hidden_by_receiver = FALSE))
        ORDER BY created_at ASC LIMIT 100""" % (user['id'], partner_id.replace("'", "''"), partner_id.replace("'", "''"), user['id']))
    msgs = []
    for r in cur.fetchall():
        msgs.append({
            'id': str(r[0]), 'sender_id': str(r[1]), 'receiver_id': str(r[2]),
            'content': r[3], 'reply_to_id': str(r[4]) if r[4] else None,
            'is_read': r[5], 'is_pinned': r[6],
            'edited_at': r[7].isoformat() if r[7] else None,
            'created_at': r[8].isoformat() if r[8] else None
        })
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(msgs, default=str)}


def create_story(body, user):
    image_url = body.get('image_url', '')
    visibility = body.get('visibility', 'all')
    if not image_url:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Image required'})}
    conn = get_db()
    cur = conn.cursor()
    sid = str(uuid.uuid4())
    cur.execute("INSERT INTO stories (id, user_id, image_url, visibility) VALUES ('%s', '%s', '%s', '%s')" % (sid, user['id'], image_url.replace("'", "''"), visibility.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'id': sid})}


def get_stories(user):
    if not user:
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps([])}
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT s.id, s.image_url, s.visibility, s.created_at, s.expires_at,
        u.id, u.username, u.display_name, u.is_verified, u.is_artist
        FROM stories s JOIN users u ON s.user_id = u.id
        WHERE s.expires_at > NOW() AND u.is_blocked = FALSE
        ORDER BY s.created_at DESC""")
    stories = []
    for r in cur.fetchall():
        s_user_id = str(r[5])
        vis = r[2]
        can_see = False
        if s_user_id == user['id']:
            can_see = True
        elif vis == 'all':
            can_see = True
        elif vis == 'followers':
            cur.execute("SELECT id FROM follows WHERE follower_id = '%s' AND following_id = '%s' AND status = 'accepted'" % (user['id'], s_user_id))
            can_see = cur.fetchone() is not None
        elif vis == 'mutual':
            cur.execute("SELECT id FROM follows WHERE follower_id = '%s' AND following_id = '%s' AND status = 'accepted'" % (user['id'], s_user_id))
            f1 = cur.fetchone()
            cur.execute("SELECT id FROM follows WHERE follower_id = '%s' AND following_id = '%s' AND status = 'accepted'" % (s_user_id, user['id']))
            f2 = cur.fetchone()
            can_see = f1 is not None and f2 is not None
        if can_see:
            cur.execute("SELECT url FROM user_avatars WHERE user_id = '%s' AND is_primary = TRUE LIMIT 1" % s_user_id)
            av = cur.fetchone()
            stories.append({
                'id': str(r[0]), 'image_url': r[1], 'visibility': r[2],
                'created_at': r[3].isoformat() if r[3] else None,
                'expires_at': r[4].isoformat() if r[4] else None,
                'user': {'id': s_user_id, 'username': r[6], 'display_name': r[7], 'is_verified': r[8], 'is_artist': r[9], 'avatar': av[0] if av else None}
            })
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(stories, default=str)}


def get_notifications(user):
    if not user:
        return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Auth required'})}
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT n.id, n.type, n.content, n.is_read, n.created_at, n.post_id,
        u.id, u.username, u.display_name, u.is_verified
        FROM notifications n LEFT JOIN users u ON n.from_user_id = u.id
        WHERE n.user_id = '%s' ORDER BY n.created_at DESC LIMIT 50""" % user['id'])
    notifs = []
    for r in cur.fetchall():
        n = {
            'id': str(r[0]), 'type': r[1], 'content': r[2], 'is_read': r[3],
            'created_at': r[4].isoformat() if r[4] else None,
            'post_id': str(r[5]) if r[5] else None,
            'from_user': {'id': str(r[6]), 'username': r[7], 'display_name': r[8], 'is_verified': r[9]} if r[6] else None
        }
        if n['from_user']:
            cur.execute("SELECT url FROM user_avatars WHERE user_id = '%s' AND is_primary = TRUE LIMIT 1" % n['from_user']['id'])
            av = cur.fetchone()
            n['from_user']['avatar'] = av[0] if av else None
        notifs.append(n)
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(notifs, default=str)}


def read_notifications(user):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE notifications SET is_read = TRUE WHERE user_id = '%s' AND is_read = FALSE" % user['id'])
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def block_user(body, user):
    blocked_id = body.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM blocks WHERE blocker_id = '%s' AND blocked_id = '%s'" % (user['id'], blocked_id.replace("'", "''")))
    if not cur.fetchone():
        cur.execute("INSERT INTO blocks (blocker_id, blocked_id) VALUES ('%s', '%s')" % (user['id'], blocked_id.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def unblock_user(body, user):
    blocked_id = body.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM blocks WHERE blocker_id = '%s' AND blocked_id = '%s'" % (user['id'], blocked_id.replace("'", "''")))
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE blocks SET blocker_id = '00000000-0000-0000-0000-000000000000' WHERE id = '%s'" % str(row[0]))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def create_report(body, user):
    target_type = body.get('target_type', '')
    target_id = body.get('target_id', '')
    reason = body.get('reason', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES ('%s', '%s', '%s', '%s')" % (user['id'], target_type.replace("'", "''"), target_id.replace("'", "''"), reason.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def request_verification(body, user):
    vtype = body.get('type', 'standard')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM verification_requests WHERE user_id = '%s' AND status = 'pending'" % user['id'])
    if cur.fetchone():
        conn.close()
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Already pending'})}
    cur.execute("INSERT INTO verification_requests (user_id, type) VALUES ('%s', '%s')" % (user['id'], vtype.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def view_post(body, user):
    post_id = body.get('post_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE posts SET views_count = views_count + 1 WHERE id = '%s'" % post_id.replace("'", "''"))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def create_appeal(body, user):
    reason = body.get('reason', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO appeal_requests (user_id, reason) VALUES ('%s', '%s')" % (user['id'], reason.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def delete_account(user):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET is_blocked = TRUE, username = username || '_deleted_' || '%s', email = email || '_deleted' WHERE id = '%s'" % (str(uuid.uuid4())[:8], user['id']))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def upload_avatar(body, user):
    url = body.get('url', '')
    if not url:
        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'URL required'})}
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE user_avatars SET is_primary = FALSE WHERE user_id = '%s'" % user['id'])
    aid = str(uuid.uuid4())
    cur.execute("INSERT INTO user_avatars (id, user_id, url, is_primary) VALUES ('%s', '%s', '%s', TRUE)" % (aid, user['id'], url.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'id': aid})}


def remove_avatar(body, user):
    avatar_id = body.get('avatar_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE user_avatars SET is_primary = FALSE, url = 'removed' WHERE id = '%s' AND user_id = '%s'" % (avatar_id.replace("'", "''"), user['id']))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def set_primary_avatar(body, user):
    avatar_id = body.get('avatar_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE user_avatars SET is_primary = FALSE WHERE user_id = '%s'" % user['id'])
    cur.execute("UPDATE user_avatars SET is_primary = TRUE WHERE id = '%s' AND user_id = '%s'" % (avatar_id.replace("'", "''"), user['id']))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def get_followers(params, user):
    uid = params.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT u.id, u.username, u.display_name, u.is_verified, u.is_artist
        FROM follows f JOIN users u ON f.follower_id = u.id
        WHERE f.following_id = '%s' AND f.status = 'accepted' AND u.is_blocked = FALSE""" % uid.replace("'", "''"))
    result = []
    for r in cur.fetchall():
        u = {'id': str(r[0]), 'username': r[1], 'display_name': r[2], 'is_verified': r[3], 'is_artist': r[4]}
        cur.execute("SELECT url FROM user_avatars WHERE user_id = '%s' AND is_primary = TRUE LIMIT 1" % u['id'])
        av = cur.fetchone()
        u['avatar'] = av[0] if av else None
        result.append(u)
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result)}


def get_following(params, user):
    uid = params.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT u.id, u.username, u.display_name, u.is_verified, u.is_artist
        FROM follows f JOIN users u ON f.following_id = u.id
        WHERE f.follower_id = '%s' AND f.status = 'accepted' AND u.is_blocked = FALSE""" % uid.replace("'", "''"))
    result = []
    for r in cur.fetchall():
        u = {'id': str(r[0]), 'username': r[1], 'display_name': r[2], 'is_verified': r[3], 'is_artist': r[4]}
        cur.execute("SELECT url FROM user_avatars WHERE user_id = '%s' AND is_primary = TRUE LIMIT 1" % u['id'])
        av = cur.fetchone()
        u['avatar'] = av[0] if av else None
        result.append(u)
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result)}


def get_friends(params, user):
    uid = params.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT u.id, u.username, u.display_name, u.is_verified, u.is_artist
        FROM follows f1 JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
        JOIN users u ON f1.following_id = u.id
        WHERE f1.follower_id = '%s' AND f1.status = 'accepted' AND f2.status = 'accepted' AND u.is_blocked = FALSE""" % uid.replace("'", "''"))
    result = []
    for r in cur.fetchall():
        u = {'id': str(r[0]), 'username': r[1], 'display_name': r[2], 'is_verified': r[3], 'is_artist': r[4]}
        cur.execute("SELECT url FROM user_avatars WHERE user_id = '%s' AND is_primary = TRUE LIMIT 1" % u['id'])
        av = cur.fetchone()
        u['avatar'] = av[0] if av else None
        result.append(u)
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result)}


def get_user_posts(params, user):
    uid = params.get('user_id', '')
    offset = int(params.get('offset', '0'))
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT p.id, p.content, p.image_url, p.views_count, p.created_at,
        u.id, u.username, u.display_name, u.is_verified, u.is_artist,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id),
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_hidden = FALSE),
        (SELECT COUNT(*) FROM reposts WHERE post_id = p.id)
        FROM posts p JOIN users u ON p.user_id = u.id
        WHERE p.user_id = '%s' AND p.is_hidden = FALSE
        ORDER BY p.created_at DESC LIMIT 20 OFFSET %d""" % (uid.replace("'", "''"), offset))
    posts = []
    for r in cur.fetchall():
        post = {
            'id': str(r[0]), 'content': r[1], 'image_url': r[2], 'views_count': r[3],
            'created_at': r[4].isoformat() if r[4] else None,
            'user': {'id': str(r[5]), 'username': r[6], 'display_name': r[7], 'is_verified': r[8], 'is_artist': r[9]},
            'likes_count': r[10], 'comments_count': r[11], 'reposts_count': r[12],
            'liked': False, 'reposted': False
        }
        if user:
            cur.execute("SELECT id FROM post_likes WHERE user_id = '%s' AND post_id = '%s'" % (user['id'], post['id']))
            post['liked'] = cur.fetchone() is not None
            cur.execute("SELECT id FROM reposts WHERE user_id = '%s' AND post_id = '%s'" % (user['id'], post['id']))
            post['reposted'] = cur.fetchone() is not None
        cur.execute("SELECT url FROM user_avatars WHERE user_id = '%s' AND is_primary = TRUE LIMIT 1" % post['user']['id'])
        av = cur.fetchone()
        post['user']['avatar'] = av[0] if av else None
        posts.append(post)
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(posts, default=str)}


def get_user_likes(params, user):
    uid = params.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT show_likes FROM users WHERE id = '%s'" % uid.replace("'", "''"))
    row = cur.fetchone()
    if row and row[0] == 'none' and (not user or user['id'] != uid):
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps([])}
    cur.execute("""SELECT p.id, p.content, p.image_url, p.views_count, p.created_at,
        u.id, u.username, u.display_name, u.is_verified, u.is_artist,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id),
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_hidden = FALSE)
        FROM post_likes pl JOIN posts p ON pl.post_id = p.id JOIN users u ON p.user_id = u.id
        WHERE pl.user_id = '%s' AND p.is_hidden = FALSE
        ORDER BY pl.created_at DESC LIMIT 20""" % uid.replace("'", "''"))
    posts = []
    for r in cur.fetchall():
        post = {
            'id': str(r[0]), 'content': r[1], 'image_url': r[2], 'views_count': r[3],
            'created_at': r[4].isoformat() if r[4] else None,
            'user': {'id': str(r[5]), 'username': r[6], 'display_name': r[7], 'is_verified': r[8], 'is_artist': r[9]},
            'likes_count': r[10], 'comments_count': r[11]
        }
        posts.append(post)
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(posts, default=str)}


def get_user_reposts(params, user):
    uid = params.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT show_reposts FROM users WHERE id = '%s'" % uid.replace("'", "''"))
    row = cur.fetchone()
    if row and row[0] == 'none' and (not user or user['id'] != uid):
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps([])}
    cur.execute("""SELECT p.id, p.content, p.image_url, p.views_count, p.created_at,
        u.id, u.username, u.display_name, u.is_verified, u.is_artist,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id),
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_hidden = FALSE)
        FROM reposts rp JOIN posts p ON rp.post_id = p.id JOIN users u ON p.user_id = u.id
        WHERE rp.user_id = '%s' AND p.is_hidden = FALSE
        ORDER BY rp.created_at DESC LIMIT 20""" % uid.replace("'", "''"))
    posts = []
    for r in cur.fetchall():
        post = {
            'id': str(r[0]), 'content': r[1], 'image_url': r[2], 'views_count': r[3],
            'created_at': r[4].isoformat() if r[4] else None,
            'user': {'id': str(r[5]), 'username': r[6], 'display_name': r[7], 'is_verified': r[8], 'is_artist': r[9]},
            'likes_count': r[10], 'comments_count': r[11]
        }
        posts.append(post)
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(posts, default=str)}


def admin_get_reports():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT r.id, r.target_type, r.target_id, r.reason, r.status, r.created_at,
        u.username, u.display_name FROM reports r JOIN users u ON r.reporter_id = u.id
        WHERE r.status = 'pending' ORDER BY r.created_at DESC""")
    reports = [{'id': str(r[0]), 'target_type': r[1], 'target_id': str(r[2]), 'reason': r[3], 'status': r[4], 'created_at': r[5].isoformat() if r[5] else None, 'reporter': r[6]} for r in cur.fetchall()]
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(reports, default=str)}


def admin_get_verifications():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT v.id, v.type, v.status, v.created_at, u.id, u.username, u.display_name
        FROM verification_requests v JOIN users u ON v.user_id = u.id
        WHERE v.status = 'pending' ORDER BY v.created_at DESC""")
    result = [{'id': str(r[0]), 'type': r[1], 'status': r[2], 'created_at': r[3].isoformat() if r[3] else None, 'user_id': str(r[4]), 'username': r[5], 'display_name': r[6]} for r in cur.fetchall()]
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result, default=str)}


def admin_get_appeals():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""SELECT a.id, a.reason, a.status, a.created_at, u.id, u.username, u.display_name
        FROM appeal_requests a JOIN users u ON a.user_id = u.id
        WHERE a.status = 'pending' ORDER BY a.created_at DESC""")
    result = [{'id': str(r[0]), 'reason': r[1], 'status': r[2], 'created_at': r[3].isoformat() if r[3] else None, 'user_id': str(r[4]), 'username': r[5], 'display_name': r[6]} for r in cur.fetchall()]
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result, default=str)}


def admin_verify(body):
    req_id = body.get('request_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT user_id, type FROM verification_requests WHERE id = '%s'" % req_id.replace("'", "''"))
    row = cur.fetchone()
    if not row:
        conn.close()
        return {'statusCode': 404, 'headers': cors_headers(), 'body': json.dumps({'error': 'Not found'})}
    uid = str(row[0])
    vtype = row[1]
    cur.execute("UPDATE verification_requests SET status = 'approved' WHERE id = '%s'" % req_id.replace("'", "''"))
    if vtype == 'artist':
        cur.execute("UPDATE users SET is_verified = TRUE, is_artist = TRUE WHERE id = '%s'" % uid)
    else:
        cur.execute("UPDATE users SET is_verified = TRUE WHERE id = '%s'" % uid)
    cur.execute("INSERT INTO notifications (user_id, type, content) VALUES ('%s', 'verification', 'Your verification request was approved!')" % uid)
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def admin_reject_verify(body):
    req_id = body.get('request_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT user_id FROM verification_requests WHERE id = '%s'" % req_id.replace("'", "''"))
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE verification_requests SET status = 'rejected' WHERE id = '%s'" % req_id.replace("'", "''"))
        cur.execute("INSERT INTO notifications (user_id, type, content) VALUES ('%s', 'verification', 'Your verification request was rejected')" % str(row[0]))
        conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def admin_block_user(body):
    uid = body.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET is_blocked = TRUE, block_count = block_count + 1 WHERE id = '%s'" % uid.replace("'", "''"))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def admin_unblock_user(body):
    uid = body.get('user_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET is_blocked = FALSE WHERE id = '%s'" % uid.replace("'", "''"))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def admin_hide_post(body):
    post_id = body.get('post_id', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE posts SET is_hidden = TRUE WHERE id = '%s'" % post_id.replace("'", "''"))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def admin_resolve_report(body):
    report_id = body.get('report_id', '')
    action = body.get('resolve_action', 'dismiss')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE reports SET status = '%s' WHERE id = '%s'" % (action.replace("'", "''"), report_id.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def admin_resolve_appeal(body):
    appeal_id = body.get('appeal_id', '')
    action = body.get('resolve_action', 'reject')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT user_id FROM appeal_requests WHERE id = '%s'" % appeal_id.replace("'", "''"))
    row = cur.fetchone()
    if row and action == 'approve':
        cur.execute("UPDATE users SET is_blocked = FALSE WHERE id = '%s'" % str(row[0]))
    cur.execute("UPDATE appeal_requests SET status = '%s' WHERE id = '%s'" % (action.replace("'", "''"), appeal_id.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}


def admin_add_release(body):
    artist_id = body.get('artist_id', '')
    title = body.get('title', '')
    artist_name = body.get('artist_name', '')
    cover_url = body.get('cover_url', '')
    audio_url = body.get('audio_url', '')
    conn = get_db()
    cur = conn.cursor()
    rid = str(uuid.uuid4())
    cur.execute("INSERT INTO releases (id, artist_id, title, artist_name, cover_url, audio_url) VALUES ('%s', '%s', '%s', '%s', '%s', '%s')" % (rid, artist_id.replace("'", "''"), title.replace("'", "''"), artist_name.replace("'", "''"), cover_url.replace("'", "''"), audio_url.replace("'", "''")))
    conn.commit()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'id': rid})}
