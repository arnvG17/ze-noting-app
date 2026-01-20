const { generateFlowchart } = require('./utils/generateFlowchart');
require('dotenv').config();

async function test() {
    console.log('Testing generateFlowchart...');
    const sampleText = `
    Introduction to Photosynthesis
    
    Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the aid of chlorophyll.
    
    The Process:
    1. Light Absorption: Chlorophyll absorbs energy from sunlight.
    2. Water Splitting: Water molecules are split, releasing oxygen.
    3. Carbon Fixation: Carbon dioxide is converted into glucose.
    
    Conclusion:
    Photosynthesis provides energy for nearly all life on earth.
  `;

    try {
        const result = await generateFlowchart(sampleText);
        console.log('Result:', JSON.stringify(result, null, 2));

        if (result.nodes && result.edges) {
            console.log('✅ Flowchart generation successful!');
        } else {
            console.error('❌ Invalid flowchart structure');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

test();
