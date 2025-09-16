import asyncio
import os
import tempfile
import subprocess
from typing import Tuple

import soundfile as sf


FFMPEG_BIN = os.getenv("FFMPEG_BIN", "ffmpeg")


class AudioProcessingError(Exception):
    pass


async def transcode_to_wav_16k(file_path: str) -> Tuple[str, float]:
    """Transcode input media file to 16k mono wav PCM. Returns (wav_path, duration_seconds)."""
    out_fd, out_path = tempfile.mkstemp(suffix=".wav")
    os.close(out_fd)
    cmd = [
        FFMPEG_BIN,
        "-y",
        "-i",
        file_path,
        "-ac",
        "1",
        "-ar",
        "16000",
        "-f",
        "wav",
        out_path,
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise AudioProcessingError(f"ffmpeg failed: {stderr.decode(errors='ignore')[:400]}")
    # Read duration with soundfile
    try:
        with sf.SoundFile(out_path) as f:
            frames = len(f)
            samplerate = f.samplerate
            duration = frames / float(samplerate)
    except Exception as e:  # pragma: no cover
        raise AudioProcessingError(f"Failed reading transcoded wav: {e}")
    return out_path, duration
