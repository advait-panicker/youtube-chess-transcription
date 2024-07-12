from youtube_transcript_api import YouTubeTranscriptApi
from pytube import extract
from youtube_transcript_api.formatters import TextFormatter
from youtube_transcript_api.formatters import JSONFormatter
from youtube_transcript_api.formatters import WebVTTFormatter
from youtube_transcript_api.formatters import SRTFormatter

video_id=extract.video_id(input("Enter the YouTube video link here: "))

type_of_file = input("Type the file extension you want the transcript to be in (.txt OR .json OR .vtt OR .srt): ").lower()
#txtformatter = TextFormatter()
#video_id = "LzmSy2N5GaQ"
transcript = YouTubeTranscriptApi.get_transcript(video_id)

#txt = txtformatter.format_transcript(transcript)

# with open('transcript.txt', 'w', encoding='utf-8') as txt_file:
#     txt_file.write(txt)
if type_of_file == ".txt" or type_of_file == "txt" or type_of_file == "text":
    formatter = TextFormatter()
    type_of_file = ".txt"
elif type_of_file == ".json" or type_of_file == "json":
    formatter = JSONFormatter()
    type_of_file = ".json"
elif type_of_file == ".vtt" or type_of_file == "vtt":
    formatter = WebVTTFormatter()
    type_of_file = ".vtt"
elif type_of_file == ".srt" or type_of_file == "srt":
    formatter = SRTFormatter()
    type_of_file = ".srt"
formatted = formatter.format_transcript(transcript)

with open(f'transcript{type_of_file}', 'w', encoding='utf-8') as file:
    file.write(formatted)

