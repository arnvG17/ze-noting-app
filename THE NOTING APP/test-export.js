const axios = require('axios');

const script = {
  productName: "NotebookAI",
  hookText: "What if your documents could think?",
  problemText: "Documents are messy and scattered.",
  solutionText: "Meet NotebookAI.",
  features: [
    { title: "RAG Chat", description: "Chat with documents." },
    { title: "Flowcharts", description: "Visualize connections." },
    { title: "Quizzes", description: "Test knowledge." }
  ],
  demoSteps: [
    { action: "Uploading notes...", detail: "Parsing text..." },
    { action: "Structuring...", detail: "Done." },
    { action: "Generating...", detail: "Ready." }
  ],
  ctaText: "Build knowledge faster."
};

axios.post('http://localhost:5000/api/pitch/export', {
  script,
  notebookId: 'test_run'
})
.then(res => {
  console.log('✅ Success:', res.data);
})
.catch(err => {
  console.log('❌ Failed:', err.response ? err.response.data : err.message);
});
