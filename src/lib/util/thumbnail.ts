export async function generateThumbnailFromMedia(file: File, isVideo: boolean): Promise<string | undefined> {
  const maxSize = 180;
  const mediaElement = isVideo
    ? document.createElement("video")
    : new Image();
  mediaElement.src = URL.createObjectURL(file);

  await new Promise((resolve, reject) => {
    if (isVideo) {
      const video = mediaElement as HTMLVideoElement;
      video.onloadeddata = () => {
        const seekTime = Math.min(video.duration * 0.1, 2);
        video.currentTime = seekTime;
      };
      video.onseeked = resolve;
      video.onerror = reject;
    } else {
      (mediaElement as HTMLImageElement).onload = resolve;
      (mediaElement as HTMLImageElement).onerror = reject;
    }
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  const width = isVideo
    ? (mediaElement as HTMLVideoElement).videoWidth
    : (mediaElement as HTMLImageElement).width;
  const height = isVideo
    ? (mediaElement as HTMLVideoElement).videoHeight
    : (mediaElement as HTMLImageElement).height;

  const scale = Math.max(maxSize / width, maxSize / height);
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.drawImage(mediaElement, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const isTransparent = Array.from(imageData.data).every((value, index) => {
    return (index + 1) % 4 !== 0 || value === 0;
  });
  
  if (isTransparent) {
    canvas.remove();
    return undefined;
  }

  const url = canvas.toDataURL();
  canvas.remove();
  return url;
}
