param(
  [Parameter(Mandatory=$true)][string]$Batch,
  [Parameter(Mandatory=$true)][string]$OutputDir,
  [string]$FFmpeg='ffmpeg'
)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Speech
$speaker=[System.Speech.Synthesis.SpeechSynthesizer]::new()
try {
  $voice=$speaker.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -match '^en' } | Select-Object -First 1
  if (-not $voice) { throw 'An English Windows speech voice is required.' }
  $speaker.SelectVoice($voice.VoiceInfo.Name)
  $speaker.Rate=-1
  $jobs=Get-Content -Raw -LiteralPath $Batch -Encoding UTF8 | ConvertFrom-Json
  foreach($job in $jobs){
    $wav=[IO.Path]::ChangeExtension((Join-Path (Split-Path -Parent $Batch) $job.file),'.wav')
    $output=Join-Path $OutputDir $job.file
    $speaker.SetOutputToWaveFile($wav)
    $speaker.Speak([string]$job.text)
    $speaker.SetOutputToNull()
    & $FFmpeg -nostdin -hide_banner -loglevel error -y -i $wav -map_metadata -1 -ac 1 -ar 22050 -c:a libmp3lame -b:a 48k $output
    if($LASTEXITCODE -ne 0){throw ('Encoding failed: '+$job.file)}
    Remove-Item -LiteralPath $wav
  }
} finally {
  $speaker.Dispose()
}
