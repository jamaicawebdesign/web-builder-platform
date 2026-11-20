export interface ResolvedVideoSource {
  kind: 'iframe' | 'video' | 'link';
  src: string;
  provider: 'YouTube' | 'Vimeo' | 'MP4 Video' | 'External Video';
}

export function resolveVideoSource(rawUrl: string): ResolvedVideoSource {
  const url = String(rawUrl || '').trim();
  if (!url) {
    return {
      kind: 'link',
      src: '',
      provider: 'External Video',
    };
  }

  // YouTube
  const ytMatch =
    url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/) ||
    null;
  if (ytMatch?.[1]) {
    return {
      kind: 'iframe',
      src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
      provider: 'YouTube',
    };
  }

  // Vimeo
  const vimeoMatch =
    url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)([0-9]{5,})/) ||
    null;
  if (vimeoMatch?.[1]) {
    return {
      kind: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      provider: 'Vimeo',
    };
  }

  // Direct HTML5 Video
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.startsWith('blob:')) {
    return {
      kind: 'video',
      src: url,
      provider: 'MP4 Video',
    };
  }

  return {
    kind: 'link',
    src: url,
    provider: 'External Video',
  };
}
