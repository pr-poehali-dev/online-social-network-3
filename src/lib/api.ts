const AUTH_URL = "https://functions.poehali.dev/ec750196-a441-42ad-a02f-3433d782aef0";
const API_URL = "https://functions.poehali.dev/df6e976e-9601-4ada-81dd-b0c81a8ac085";
const UPLOAD_URL = "https://functions.poehali.dev/a55ea438-0749-48eb-a627-53d69c09d740";

function getToken(): string {
  return localStorage.getItem("buzzzy_token") || "";
}

export function setToken(token: string) {
  localStorage.setItem("buzzzy_token", token);
}

export function clearToken() {
  localStorage.removeItem("buzzzy_token");
}

async function request(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  const token = getToken();
  if (token) headers["X-Auth-Token"] = token;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok && res.status !== 200) throw { status: res.status, ...data };
  return data;
}

export const auth = {
  register: (username: string, email: string, password: string) =>
    request(AUTH_URL, { method: "POST", body: JSON.stringify({ action: "register", username, email, password }) }),
  login: (email: string, password: string) =>
    request(AUTH_URL, { method: "POST", body: JSON.stringify({ action: "login", email, password }) }),
  logout: () => request(AUTH_URL, { method: "POST", body: JSON.stringify({ action: "logout" }) }),
  me: () => request(`${AUTH_URL}?action=me`),
};

export const api = {
  feed: (offset = 0) => request(`${API_URL}?action=feed&offset=${offset}`),
  post: (id: string) => request(`${API_URL}?action=post&id=${id}`),
  profile: (username: string) => request(`${API_URL}?action=profile&username=${username}`),
  comments: (postId: string) => request(`${API_URL}?action=comments&post_id=${postId}`),
  search: (q: string) => request(`${API_URL}?action=search&q=${q}`),
  followers: (userId: string) => request(`${API_URL}?action=followers&user_id=${userId}`),
  following: (userId: string) => request(`${API_URL}?action=following&user_id=${userId}`),
  friends: (userId: string) => request(`${API_URL}?action=friends&user_id=${userId}`),
  stories: () => request(`${API_URL}?action=stories`),
  notifications: () => request(`${API_URL}?action=notifications`),
  messages: () => request(`${API_URL}?action=messages`),
  conversation: (partnerId: string) => request(`${API_URL}?action=conversation&partner_id=${partnerId}`),
  userPosts: (userId: string, offset = 0) => request(`${API_URL}?action=user_posts&user_id=${userId}&offset=${offset}`),
  userLikes: (userId: string) => request(`${API_URL}?action=user_likes&user_id=${userId}`),
  userReposts: (userId: string) => request(`${API_URL}?action=user_reposts&user_id=${userId}`),

  createPost: (content: string, imageUrl?: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "create_post", content, image_url: imageUrl }) }),
  likePost: (postId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "like_post", post_id: postId }) }),
  unlikePost: (postId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "unlike_post", post_id: postId }) }),
  comment: (postId: string, content: string, parentId?: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "comment", post_id: postId, content, parent_id: parentId }) }),
  likeComment: (commentId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "like_comment", comment_id: commentId }) }),
  unlikeComment: (commentId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "unlike_comment", comment_id: commentId }) }),
  follow: (userId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "follow", user_id: userId }) }),
  unfollow: (userId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "unfollow", user_id: userId }) }),
  acceptFollow: (userId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "accept_follow", user_id: userId }) }),
  rejectFollow: (userId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "reject_follow", user_id: userId }) }),
  repost: (postId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "repost", post_id: postId }) }),
  unrepost: (postId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "unrepost", post_id: postId }) }),
  hidePost: (postId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "hide_post", post_id: postId }) }),
  hideComment: (commentId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "hide_comment", comment_id: commentId }) }),
  updateProfile: (data: Record<string, unknown>) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "update_profile", ...data }) }),
  sendMessage: (receiverId: string, content: string, replyToId?: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "send_message", receiver_id: receiverId, content, reply_to_id: replyToId }) }),
  editMessage: (messageId: string, content: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "edit_message", message_id: messageId, content }) }),
  pinMessage: (messageId: string, pinned: boolean) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "pin_message", message_id: messageId, pinned }) }),
  markRead: (senderId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "mark_read", sender_id: senderId }) }),
  createStory: (imageUrl: string, visibility: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "create_story", image_url: imageUrl, visibility }) }),
  blockUser: (userId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "block_user", user_id: userId }) }),
  unblockUser: (userId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "unblock_user", user_id: userId }) }),
  report: (targetType: string, targetId: string, reason: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "report", target_type: targetType, target_id: targetId, reason }) }),
  requestVerification: (type: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "request_verification", type }) }),
  viewPost: (postId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "view_post", post_id: postId }) }),
  appeal: (reason: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "appeal", reason }) }),
  deleteAccount: () =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "delete_account" }) }),
  uploadAvatar: (url: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "upload_avatar", url }) }),
  removeAvatar: (avatarId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "remove_avatar", avatar_id: avatarId }) }),
  setPrimaryAvatar: (avatarId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "set_primary_avatar", avatar_id: avatarId }) }),
  readNotifications: () =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "read_notifications" }) }),

  adminGetReports: () =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "admin_get_reports" }) }),
  adminGetVerifications: () =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "admin_get_verifications" }) }),
  adminGetAppeals: () =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "admin_get_appeals" }) }),
  adminVerify: (requestId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "admin_verify", request_id: requestId }) }),
  adminRejectVerify: (requestId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "admin_reject_verify", request_id: requestId }) }),
  adminBlockUser: (userId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "admin_block_user", user_id: userId }) }),
  adminUnblockUser: (userId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "admin_unblock_user", user_id: userId }) }),
  adminHidePost: (postId: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "admin_hide_post", post_id: postId }) }),
  adminResolveReport: (reportId: string, resolveAction: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "admin_resolve_report", report_id: reportId, resolve_action: resolveAction }) }),
  adminResolveAppeal: (appealId: string, resolveAction: string) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "admin_resolve_appeal", appeal_id: appealId, resolve_action: resolveAction }) }),
  adminAddRelease: (data: Record<string, string>) =>
    request(API_URL, { method: "POST", body: JSON.stringify({ action: "admin_add_release", ...data }) }),
};

export const upload = {
  file: (base64: string, type: string, folder: string) =>
    request(UPLOAD_URL, { method: "POST", body: JSON.stringify({ file: base64, type, folder }) }),
};

export default api;