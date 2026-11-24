#!/bin/zsh
# Put the song under a rendered piece: out/<name>.mp4 (no audio, starts at song time FROM, FPS frames a second)
# → out/<name>-music.mp4 (48 kHz AAC).   tools/mux.sh kaguya-s1-d1 28.6 30
FF=~/.local/ffbin/ffmpeg
cd "$(dirname "$0")/.."
name=$1; fps=${3:-60}; from=$(python3 -c "print(round($2 * $fps) / $fps)")      # (the export starts on the nearest whole frame)
dur=$($FF -i out/$name.mp4 2>&1 | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | awk -F: '{print $1*3600+$2*60+$3}')
$FF -y -loglevel error -i out/$name.mp4 -ss $from -t $dur -i audio/song.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart out/$name-music.mp4 && echo "out/$name-music.mp4 ($dur s)"
