# say.py
from gtts import gTTS
import os
import sys
import tempfile

text = " ".join(sys.argv[1:])  # Grabs all CLI args as text
tts = gTTS(text, lang="en")
with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
    tts.save(fp.name)
    os.system(f'afplay "{fp.name}"')  # macOS only
