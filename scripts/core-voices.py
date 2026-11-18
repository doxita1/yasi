"""Render the 96 original core headwords with the English Piper Alan voice (piper-tts 1.4.1)."""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import wave

from piper import SynthesisConfig

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("input_audio", root / "scripts" / "input-audio.py")
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)
parser = argparse.ArgumentParser()
parser.add_argument("model", type=Path, help="Path to en_GB-alan-medium.onnx")
voice = previous.load(parser.parse_args().model)
source = "import {headwordTopics} from './public/core-headwords.js';console.log(JSON.stringify(headwordTopics.flatMap(t=>t.rows.map(r=>r.term))));"
words = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", source], cwd=root, encoding="utf8"))
directory = root / "public" / "core-audio"
directory.mkdir(exist_ok=True)
for word in words:
    with wave.open(str(directory / (word + ".wav")), "wb") as output:
        output.setparams((1, 2, voice.config.sample_rate, 0, "NONE", "not compressed"))
        for chunk in voice.synthesize(word, SynthesisConfig(length_scale=1.05)):
            output.writeframes(chunk.audio_int16_bytes)
print(f"Rendered {len(words)} pronunciations.")
