const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.webm', '.m4v'];

const stripUrlQueryAndHash = (uri: string): string =>
  uri.split('?')[0].split('#')[0].trim().toLowerCase();

export const extractUriString = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object' && typeof value.uri === 'string') {
    return value.uri.trim();
  }
  return '';
};

export const isPdfUri = (uri?: string | null): boolean => {
  if (!uri || typeof uri !== 'string') return false;
  return stripUrlQueryAndHash(uri).endsWith('.pdf');
};

export const isVideoUri = (uri?: string | null): boolean => {
  if (!uri || typeof uri !== 'string') return false;
  const clean = stripUrlQueryAndHash(uri);
  return VIDEO_EXTENSIONS.some(ext => clean.endsWith(ext));
};

export const formatRelativeTimeAgo = (dateString?: string | null): string => {
  if (!dateString) return '';
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return '';

  const diffInSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
};

export const formatPostDate = (dateString?: string | null): string | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
};

export interface ClassifiedAttachments {
  imageUrls: { uri: string }[];
  videoUrls: { uri: string }[];
  pdfUrls: { uri: string }[];
}

export const classifyAttachmentUrls = (
  attachmentUrl?: string | null,
): ClassifiedAttachments => {
  const imageUrls: { uri: string }[] = [];
  const videoUrls: { uri: string }[] = [];
  const pdfUrls: { uri: string }[] = [];

  if (!attachmentUrl || typeof attachmentUrl !== 'string') {
    return { imageUrls, videoUrls, pdfUrls };
  }

  attachmentUrl.split(',').forEach(rawUrl => {
    const trimmedUrl = rawUrl.trim();
    if (!trimmedUrl) return;
    if (isVideoUri(trimmedUrl)) {
      videoUrls.push({ uri: trimmedUrl });
    } else if (isPdfUri(trimmedUrl)) {
      pdfUrls.push({ uri: trimmedUrl });
    } else {
      imageUrls.push({ uri: trimmedUrl });
    }
  });

  return { imageUrls, videoUrls, pdfUrls };
};

export const mapPostToNewsCardProps = (post: any) => {
  const { imageUrls, videoUrls, pdfUrls } = classifyAttachmentUrls(
    post?.attachmentUrl,
  );

  return {
    author: post?.user?.fullName || 'Unknown User',
    timeAgo: formatRelativeTimeAgo(post?.createdAt),
    description: post?.content || post?.title || '',
    imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined,
    imageUrls: imageUrls.length > 1 ? imageUrls : undefined,
    videoUrl: videoUrls.length > 0 ? videoUrls[0] : undefined,
    videoUrls: videoUrls.length > 1 ? videoUrls : undefined,
    pdfUrl: pdfUrls.length > 0 ? pdfUrls[0] : undefined,
    pdfUrls: pdfUrls.length > 1 ? pdfUrls : undefined,
    achievement: post?.title && !post?.content ? post.title : null,
    achievementDate: formatPostDate(post?.createdAt),
    postId: post?.id ?? post?._id,
    initialLikeStatus: Boolean(post?.stats?.isLiked),
    initialLikeCount: post?.stats?.likesCount ?? post?.stats?.likes ?? 0,
    recentComments: post?.recentComments || [],
    title: post?.title,
    stats: post?.stats || {},
    userId: post?.user?.id ?? post?.user?._id,
    profilePicture: post?.user?.profilePicture,
    isVerified: Boolean(post?.user?.idVerified),
    company: post?.user?.company,
    designation: post?.user?.designation,
  };
};

