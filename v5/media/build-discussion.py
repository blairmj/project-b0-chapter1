"""Render the fixed-camera, subtitled classroom discussion (no camera motion/audio)."""
import argparse
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
MEDIA = ROOT / "v5" / "media"
ASSETS = ROOT / "v5" / "assets"
DIALOGUE = [
    (0, 3.8, "남자아이", "24 ÷ 3 × 2. 나는 답이 4가 나왔어."),
    (3.8, 6.8, "여자아이", "어떻게 계산했는데?"),
    (6.8, 11, "남자아이", "3 × 2가 6이니까, 24 ÷ 6을 했어."),
    (11, 15.2, "여자아이", "24 ÷ 3을 먼저 계산하면 어떨까?"),
    (15.2, 19.6, "남자아이", "곱셈이 있으니까 곱셈부터 하는 거 아니야?"),
    (19.6, 23.6, "여자아이", "곱셈과 나눗셈, 어느 쪽이 먼저지?"),
    (23.6, 28, "여자아이", "틀렸다고만 나오네. 이유는 안 알려 줘."),
    (28, 32.5, "남자아이", "우리 풀이에서 어느 부분을 고쳐야 할까?"),
]


def stamp(value, ass=False):
    hours, rest = divmod(value, 3600)
    minutes, seconds = divmod(rest, 60)
    return (f"{int(hours)}:{int(minutes):02}:{seconds:05.2f}" if ass else
            f"{int(hours):02}:{int(minutes):02}:{seconds:06.3f}")


def build(image):
    ASSETS.mkdir(exist_ok=True)
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Math,Malgun Gothic,48,&H00F4F7EC,&H000000FF,&H00162612,&H00162612,-1,0,0,0,100,100,0,0,1,1,0,5,15,15,15,1
Style: Caption,Malgun Gothic,29,&H00FFFFFF,&H000000FF,&H00181008,&H00181008,0,0,0,0,100,100,0,0,3,9,0,2,30,30,26,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []

    def event(start, end, style, text, pos=None, size=None, color=None):
        tags = (f"\\pos({pos[0]},{pos[1]})" if pos else "")
        tags += f"\\fs{size}" if size else ""
        tags += f"\\c&H{color}&" if color else ""
        text = ("{" + tags + "}" if tags else "") + text
        lines.append(f"Dialogue: 0,{stamp(start, True)},{stamp(end, True)},{style},,0,0,0,,{text}")

    event(0, 32.5, "Math", "24 ÷ 3 × 2", (640, 178), 49)
    event(6.8, 32.5, "Math", "3 × 2 = 6", (640, 260), 38)
    event(8.6, 32.5, "Math", "24 ÷ 6 = 4", (640, 322), 38)
    event(11, 23.6, "Math", "24 ÷ 3을 먼저 하면?", (640, 402), 29, "A6EAF7")
    event(23.6, 32.5, "Math", "오답 · 다시 입력하십시오.", (640, 403), 27, "A7A6F2")
    for start, end, speaker, words in DIALOGUE:
        event(start, end, "Caption", f"{speaker}: {words}")
    ass_file = MEDIA / "education-discussion-v1.ass"
    ass_file.write_text(header + "\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    vtt = "WEBVTT\n\n" + "\n\n".join(
        f"{stamp(start)} --> {stamp(end)}\n{speaker}: {words}"
        for start, end, speaker, words in DIALOGUE
    ) + "\n"
    (ASSETS / "education-discussion-v1.vtt").write_text(vtt, encoding="utf-8", newline="\n")
    video = ASSETS / "education-discussion-v1.mp4"
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-loop", "1",
        "-i", str(image), "-vf",
        "scale=1280:720:flags=lanczos,setsar=1,ass=v5/media/education-discussion-v1.ass",
        "-t", "32.5", "-r", "24", "-c:v", "libx264", "-preset", "medium",
        "-tune", "stillimage", "-crf", "23", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", "-an", str(video),
    ], cwd=ROOT, check=True)
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", "1",
        "-i", str(video), "-frames:v", "1", "-quality", "88",
        str(ASSETS / "education-discussion-v1.webp"),
    ], check=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, required=True)
    build(parser.parse_args().image)
