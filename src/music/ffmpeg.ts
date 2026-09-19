import ffmpegPath from'ffmpeg-static';export function ffmpeg(){if(!ffmpegPath)throw new Error('FFmpeg tidak tersedia');return ffmpegPath}
