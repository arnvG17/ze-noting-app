const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const chat = require('../utils/llm3');
const { query } = require('../db/pool');

/**
 * Generate a structured script for the cinematic pitch deck video
 * POST /api/pitch/generate
 */
exports.generateScript = async (req, res) => {
  try {
    const { productName, features, audience, notebookId, userInput } = req.body;
    let descriptionText = "";

    // If notebookId is provided, pull context from documents
    if (notebookId) {
      const docsResult = await query(
        "SELECT id, filename, summary FROM documents WHERE notebook_id = $1 AND status = 'ready'",
        [notebookId]
      );
      if (docsResult.rows.length > 0) {
        const docIds = docsResult.rows.map(r => r.id);
        
        // Fetch actual document text extracts from chunks
        const chunksResult = await query(
          "SELECT content FROM chunks WHERE document_id = ANY($1::uuid[]) ORDER BY chunk_index LIMIT 15",
          [docIds]
        );
        const chunksText = chunksResult.rows.map(r => r.content).join('\n\n');
        
        descriptionText = docsResult.rows.map(r => `Document: ${r.filename}\nSummary: ${r.summary}`).join('\n\n') +
          "\n\n--- Core Document Content Extracts ---\n" + chunksText;
      }
    }

    const systemPrompt = `You are a world-class pitch deck and presentation writer. 
Your goal is to write a cinematic 60-second pitch/presentation script summarizing and pitching the core subject, concept, project, or thesis presented in the provided documents.

You MUST respond with a single valid JSON object. Do NOT wrap it in markdown blockquotes, and do not add any text before or after the JSON.

The pitch/presentation is for the concept/subject of the document. The script will be used to animate a video featuring:
1. RAG Chat simulation (user question, AI answer with inline citation about Feature 1)
2. Interactive Flowchart simulation (3 process/concept nodes representing Feature 2)
3. Smart Quiz simulation (1 multiple choice question with 4 options, correct index, and explanation testing Feature 3)

JSON Structure:
{
  "productName": "A short, punchy name of the project, concept, or subject described in the document (max 3 words)",
  "hookText": "A compelling 1-sentence hook question questioning the status quo or domain-specific struggles based on the document content (Scene 1) (e.g. 'What if we could predict heart failure using simple wearable sensors?')",
  "problemText": "A 1-sentence description of the problem, mess, or challenge in the document's subject domain (Scene 2) (e.g. 'Cardiac issues are often detected too late because current clinical models require hospital-grade diagnostics.')",
  "solutionText": "A 1-sentence solution or core finding/concept presented in the document (Scene 3) (e.g. 'Our deep learning framework processes stream sensor data to detect arrhythmias hours before they become critical.')",
  "features": [
    { 
      "title": "A key pillar, capability, or concept from the document", 
      "description": "1-sentence explanation of this first pillar",
      "simulatedChat": {
        "userQuestion": "A realistic question a user would ask about this first pillar (max 15 words)",
        "aiAnswer": "A professional AI answer summarizing a key point from the document about this pillar, including a citation like [Source: filename.pdf, p.4] (max 30 words)"
      }
    },
    { 
      "title": "A core process, system flow, or methodology from the document", 
      "description": "1-sentence explanation of this second pillar",
      "simulatedFlowchart": {
        "nodeA": "The first sequential step, concept, or phase (under 18 chars)",
        "nodeB": "The second sequential step, concept, or phase (under 18 chars)",
        "nodeC": "The final sequential step, concept, or phase (under 18 chars)"
      }
    },
    { 
      "title": "Evaluation, validation, or a key fact from the document", 
      "description": "1-sentence explanation of this third pillar",
      "simulatedQuiz": {
        "question": "A multiple-choice question testing knowledge about a core fact/metric in this third pillar (max 15 words)",
        "options": [
          "A) Option A text",
          "B) Option B text",
          "C) Option C text",
          "D) Option D text"
        ],
        "correctIndex": 2, // 0-based index of the correct option
        "feedback": "Feedback message explaining why the answer is correct (under 12 words)"
      }
    }
  ],
  "demoSteps": [
    { "action": "First key phase/step in building or demonstrating this subject", "detail": "Sub-detail message of first phase" },
    { "action": "Second key phase/step in building or demonstrating this subject", "detail": "Sub-detail message of second phase" },
    { "action": "Third key phase/step in building or demonstrating this subject", "detail": "Sub-detail message of third phase" }
  ],
  "ctaText": "A powerful 1-sentence closing statement summarizing the next steps, vision, or impact of this subject (Scene 6)"
}`;

    let userPrompt = ``;
    if (descriptionText) {
      userPrompt = `Generate a custom pitch script based on the following document context:\n\n${descriptionText}\n\n`;
      if (userInput) {
        userPrompt += `Additional User Instructions / Tone / Focus:\n${userInput}\n\n`;
      }
    } else {
      userPrompt = `Generate a pitch script for:
Product Name: ${productName || "NotebookAI"}
Key Features: ${features ? features.join(', ') : "RAG chat, flowcharts, quizzes, audio overview"}
Target Audience: ${audience || "students, researchers"}\n\n`;
      if (userInput) {
        userPrompt += `Additional User Instructions / Tone / Focus:\n${userInput}\n\n`;
      }
    }

    console.log('🤖 Generating pitch deck script...');
    const response = await chat.call([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    let scriptData;
    try {
      // Clean up LLM response in case it includes markdown backticks
      let cleanContent = response.content.trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      scriptData = JSON.parse(cleanContent);
    } catch (parseErr) {
      console.error('Failed to parse LLM script content:', response.content);
      return res.status(500).json({ error: "LLM response was not valid JSON", raw: response.content });
    }

    res.json(scriptData);

  } catch (err) {
    console.error('Error generating pitch script:', err);
    res.status(500).json({ error: "Failed to generate pitch script" });
  }
};

/**
 * Render/export the Remotion composition as an MP4 video file
 * POST /api/pitch/export
 */
exports.exportVideo = async (req, res) => {
  const { script, notebookId } = req.body;
  
  if (!script) {
    return res.status(400).json({ error: "script parameters are required to export" });
  }

  const exportId = notebookId || `temp_${Date.now()}`;
  const remotionDir = path.join(__dirname, '../../remotion');
  const uploadsDir = path.join(__dirname, '../uploads');
  const tempPropsFile = path.join(remotionDir, `props_${exportId}.json`);
  const outputVideoName = `pitch_${exportId}.mp4`;
  const outputVideoPath = path.join(uploadsDir, outputVideoName);

  try {
    // 1. Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 2. Write the script parameters to a local temp JSON props file
    fs.writeFileSync(tempPropsFile, JSON.stringify(script, null, 2), 'utf8');

    // 3. Construct the npx remotion render command
    // Note: We use powershell wrapper redirect if needed, or directly npx
    // Run npx remotion render NotebookAIPitch output_path --props=props_file.json
    const relativePropsPath = `props_${exportId}.json`;
    const command = `npx remotion render NotebookAIPitch "${outputVideoPath}" --props="${relativePropsPath}" --overwrite`;

    console.log(`🎥 Starting Remotion Export: [${command}] inside [${remotionDir}]`);

    // 4. Execute command
    exec(command, { cwd: remotionDir }, (error, stdout, stderr) => {
      // Cleanup temp props file
      try {
        if (fs.existsSync(tempPropsFile)) {
          fs.unlinkSync(tempPropsFile);
        }
      } catch (unlinkErr) {
        console.warn('⚠️ Failed to clean up temp props file:', unlinkErr.message);
      }

      if (error) {
        console.error('❌ Remotion render failed:', error.message);
        console.error('Stderr:', stderr);
        console.error('Stdout:', stdout);
        
        return res.status(500).json({ 
          error: "Remotion rendering process failed.", 
          details: error.message,
          stderr,
          cliInstruction: `npx remotion render NotebookAIPitch out/video.mp4 --props=props_${exportId}.json`
        });
      }

      console.log('✅ Remotion export completed successfully:', outputVideoName);
      
      // Return URL to access/download the video
      const downloadUrl = `/uploads/${outputVideoName}`;
      res.json({ 
        success: true, 
        videoUrl: downloadUrl,
        filename: outputVideoName
      });
    });

  } catch (err) {
    console.error('Error initiating video export:', err);
    res.status(500).json({ error: "Failed to initiate video export", details: err.message });
  }
};
