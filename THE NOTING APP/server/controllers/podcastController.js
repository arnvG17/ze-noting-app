const path = require('path');
const fs = require('fs');
const axios = require('axios');
const chat = require('../utils/llm3');
const { query } = require('../db/pool');

// Mapping for BCP-47 language codes to native language script names
const LANGUAGE_MAP = {
  'en-IN': 'English (Indian accent)',
  'hi-IN': 'Hindi (हिंदी)',
  'bn-IN': 'Bengali (বাংলা)',
  'gu-IN': 'Gujarati (ગુજરાતી)',
  'kn-IN': 'Kannada (ಕನ್ನಡ)',
  'ml-IN': 'Malayalam (മലയാളം)',
  'mr-IN': 'Marathi (मराठी)',
  'od-IN': 'Odia (ଓଡ଼ିଆ)',
  'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
  'ta-IN': 'Tamil (தமிழ்)',
  'te-IN': 'Telugu (తెలుగు)'
};

/**
 * Generate a dialogue/narration script based on the documents in a notebook
 * POST /api/podcast/generate-script
 */
exports.generateScript = async (req, res) => {
  try {
    const { notebookId, selectedDocIds, tone, language, customGuidelines } = req.body;

    if (!notebookId) {
      return res.status(400).json({ error: "notebookId is required" });
    }

    const targetLang = language || 'en-IN';
    const langName = LANGUAGE_MAP[targetLang] || 'English (Indian accent)';

    let descriptionText = "";

    // 1. Fetch document summaries & text chunks from DB
    let docsQuery = "SELECT id, filename, summary FROM documents WHERE notebook_id = $1 AND status = 'ready'";
    let queryParams = [notebookId];

    if (selectedDocIds && selectedDocIds.length > 0) {
      docsQuery += " AND id = ANY($2::uuid[])";
      queryParams.push(selectedDocIds);
    }

    const docsResult = await query(docsQuery, queryParams);

    if (docsResult.rows.length === 0) {
      return res.status(400).json({ error: "No ready documents found to generate a podcast from." });
    }

    const docIds = docsResult.rows.map(r => r.id);
    
    // Fetch up to 8 chunks for solid coverage (limited to avoid Groq 12k TPM rate limits)
    const chunksResult = await query(
      "SELECT content FROM chunks WHERE document_id = ANY($1::uuid[]) ORDER BY chunk_index LIMIT 8",
      [docIds]
    );
    const chunksText = chunksResult.rows.map(r => r.content).join('\n\n');
    
    descriptionText = docsResult.rows.map(r => `Document: ${r.filename}\nSummary: ${r.summary}`).join('\n\n') +
      "\n\n--- Detailed Content Extracts ---\n" + chunksText;

    // 2. Map tone style
    let toneDescription = "professional overview";
    if (tone === 'conversational') {
      toneDescription = "engaging conversational style, like a friendly podcast host explaining concepts to a listener";
    } else if (tone === 'educational') {
      toneDescription = "informative and structured lecture style, explaining complex concepts clearly";
    } else if (tone === 'summary') {
      toneDescription = "concise executive briefing summarizing the main findings and highlights";
    } else if (tone === 'dramatic') {
      toneDescription = "expressive narrative style, highlighting key breakthroughs and dramatic impacts";
    }

    // 3. Prepare prompt
    const systemPrompt = `You are a world-class audio scriptwriter and editor.
Your task is to write a highly compelling, natural-sounding audio script/narration summarizing the provided documents.

The script MUST follow these strict requirements:
1. TARGET LANGUAGE: You must write the entire script in ${langName}. If it is not English, write in the native script (e.g. Devanagari script for Hindi, Tamil script for Tamil, etc.).
2. STYLE/TONE: Use a ${toneDescription}.
3. LENGTH: The script MUST be under 1,800 characters (approximately 250-300 words). This is a hard limit to satisfy the Text-to-Speech API restriction.
4. TEXT-TO-SPEECH FORMATTING:
   - DO NOT include markdown formatting like headers (#), bold (**), or italics (*).
   - DO NOT include bracketed speaker identifiers, sound effects, or music directions (like "[Host]:", "[Guest]:", "[Sound Effect: Music Up]", "(laughing)", "[Host Name]").
   - The text must be generated as a single, continuous, natural flowing block of speech that a single voice actor can read from start to finish without pausing or saying structural words.
   - Do not use lists or bullet points; write in natural prose paragraphs.

Ensure all details in the script are strictly based on the provided document context. Do not invent facts outside the text.`;

    let userPrompt = `Generate the podcast overview script based on this document context:\n\n${descriptionText}\n\n`;
    if (customGuidelines) {
      userPrompt += `Additional Custom Guidelines to incorporate:\n${customGuidelines}\n\n`;
    }

    console.log(`🤖 Generating Podcast script in ${langName} (Tone: ${tone || 'default'})...`);
    
    const response = await chat.call([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    res.json({
      success: true,
      script: response.content.trim(),
      language: targetLang,
      tone: tone || 'default'
    });

  } catch (err) {
    console.error('Error generating podcast script:', err);
    res.status(500).json({ error: "Failed to generate podcast script." });
  }
};

/**
 * Convert text script to audio speech using Sarvam AI TTS
 * POST /api/podcast/synthesize
 */
exports.synthesizePodcast = async (req, res) => {
  try {
    const { text, languageCode, speaker, pace } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text script is required for synthesis." });
    }

    const apiKey = process.env.SARVAM_API;
    if (!apiKey) {
      console.warn("⚠️ SARVAM_API key is missing in environment variables!");
      return res.status(500).json({ error: "Sarvam API key is not configured on the server." });
    }

    const targetLang = languageCode || 'en-IN';
    const targetSpeaker = speaker || 'aditya';
    const targetPace = parseFloat(pace) || 1.0;

    console.log(`🎙️ Sending TTS synthesis request to Sarvam (Language: ${targetLang}, Speaker: ${targetSpeaker}, Pace: ${targetPace})...`);

    // Call Sarvam AI TTS REST API
    const response = await axios.post('https://api.sarvam.ai/text-to-speech', {
      text: text.trim(),
      target_language_code: targetLang,
      speaker: targetSpeaker,
      pace: targetPace,
      model: "bulbul:v3",
      speech_sample_rate: 24000,
      enable_preprocessing: true
    }, {
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || !response.data.audios || response.data.audios.length === 0) {
      console.error("❌ Sarvam TTS API did not return audio data:", response.data);
      return res.status(500).json({ error: "Failed to synthesize audio from Sarvam API." });
    }

    // Decode base64 to binary buffer
    const base64Audio = response.data.audios[0];
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save audio file as WAV
    const fileName = `podcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, audioBuffer);

    console.log(`✅ Podcast audio synthesized successfully: ${fileName}`);

    // Return relative access URL
    const audioUrl = `/uploads/${fileName}`;
    res.json({
      success: true,
      audioUrl,
      fileName
    });

  } catch (err) {
    console.error('Error synthesizing podcast audio:', err.response?.data || err.message);
    res.status(500).json({ 
      error: "Failed to synthesize podcast audio.", 
      details: err.response?.data || err.message 
    });
  }
};
