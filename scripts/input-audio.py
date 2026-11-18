"""Render the original Input Lab lessons. pip install piper-tts==1.4.1; pass downloaded en_GB-alan-medium and en_US-lessac-medium model paths."""
from pathlib import Path
import argparse, json, subprocess, tempfile, wave
import onnxruntime as ort
from piper import PiperVoice, SynthesisConfig
from piper.config import PiperConfig

def load(model):
    options = ort.SessionOptions()
    options.intra_op_num_threads = 3
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(model), sess_options=options, providers=["CPUExecutionProvider"])
    return PiperVoice(session, PiperConfig.from_dict(json.loads(Path(str(model)+".json").read_text(encoding="utf-8"))))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--uk",required=True,type=Path)
    parser.add_argument("--us",required=True,type=Path)
    parser.add_argument("--ffmpeg",default="ffmpeg")
    parser.add_argument("--lexis",action="store_true",help="Render the 60 dictated academic expressions instead of the four listening passages.")
    args=parser.parse_args()
    root=Path(__file__).resolve().parents[1]
    js="import {listeningSets} from './public/input-listening.js';console.log(JSON.stringify(listeningSets))"
    if args.lexis:
        js="import {lexisModules} from './public/input-lexis.js';console.log(JSON.stringify(lexisModules.flatMap((m,i)=>m.terms.map((t,j)=>({id:'word-'+i+'-'+j,turns:[[j%2?'Guide':'Lecturer',t.term]]})))))"
    sets=json.loads(subprocess.check_output(["node","--input-type=module","-e",js],cwd=root,encoding="utf-8"))
    voices={"uk":load(args.uk),"us":load(args.us)}
    speak=SynthesisConfig(length_scale=0.96,volume=0.92)
    output=root/"public"/"input-audio";output.mkdir(exist_ok=True)
    timings={}
    for exercise in sets:
        marks=[]; frames=0;sample_rate=22050
        with tempfile.TemporaryDirectory() as scratch:
            wav_path=Path(scratch)/"record.wav"
            with wave.open(str(wav_path),"wb") as recording:
                recording.setparams((1,2,sample_rate,0,'NONE','not compressed'))
                for name,text in exercise['turns']:
                    marks.append(round(frames/sample_rate,3))
                    voice=voices["us" if name in {"Leah","Mina","Guide"} else "uk"]
                    for segment in voice.synthesize(text,speak):
                        pcm=segment.audio_int16_bytes
                        pause=b'\0\0'*int(sample_rate*0.18)
                        recording.writeframesraw(pcm+pause);frames+=len(pcm)//2+len(pause)//2
                    pause=b'\0\0'*int(sample_rate*0.30)
                    recording.writeframesraw(pause);frames+=len(pause)//2
            mp3=output/(exercise['id']+'.mp3')
            subprocess.run([args.ffmpeg,"-nostdin","-hide_banner","-loglevel","error","-y","-i",str(wav_path),"-ac","1","-ar",str(sample_rate),"-c:a","libmp3lame","-b:a","64k",str(mp3)],check=True)
        timings[exercise['id']]={"marks":marks,"duration":round(frames/sample_rate,2)}
        print(exercise['id'],timings[exercise['id']]['duration'],flush=True)
    if not args.lexis:
        (output/"marks.json").write_text(json.dumps(timings,indent=2),encoding="utf-8")
if __name__=="__main__":main()
