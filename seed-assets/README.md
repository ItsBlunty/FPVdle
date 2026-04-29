# Seed assets

Drop a small placeholder image and video here so the seed script can copy them into the media volume:

- `test-placeholder.png` — any small PNG (a 200x200 colored square is fine)
- `test-placeholder.mp4` — any short MP4 (a 1-second clip is fine)

The seed script (`npm run seed`) copies these into `$MEDIA_DIR/images/` and `$MEDIA_DIR/videos/` if they aren't already there. If the assets are missing, the seed continues with a warning — the puzzle will still load but the image/video clue will 404.

Generate a tiny placeholder image with ImageMagick:

```bash
convert -size 400x300 xc:'#1f6feb' -gravity center -fill white -pointsize 40 -annotate 0 'placeholder' test-placeholder.png
```

Generate a 1-second placeholder video with ffmpeg:

```bash
ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=text='placeholder':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2" -c:v libx264 -t 1 test-placeholder.mp4
```
