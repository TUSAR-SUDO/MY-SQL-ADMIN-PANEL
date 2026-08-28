const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

async function createSampleDocx() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "General Knowledge Quiz - MCQs with Hints",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          
          // Question 1
          new Paragraph({
            children: [
              new TextRun({ text: "1. Who is India's Prime Minister?", bold: true }),
            ],
            spacing: { before: 150, after: 50 },
          }),
          new Paragraph({ text: "A) Jawaharlal Nehru" }),
          new Paragraph({ text: "B) APJ Abdul Kalam" }),
          new Paragraph({ text: "C) Mahatma Gandhi" }),
          new Paragraph({ text: "D) Narendra Modi" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Hint: He was previously the Chief Minister of Gujarat.", italics: true, color: "718096" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Answer: D", bold: true, color: "2B6CB0" }),
            ],
            spacing: { after: 200 },
          }),

          // Question 2
          new Paragraph({
            children: [
              new TextRun({ text: "2. What is the national bird of India?", bold: true }),
            ],
            spacing: { before: 150, after: 50 },
          }),
          new Paragraph({ text: "A) Peacock" }),
          new Paragraph({ text: "B) Parrot" }),
          new Paragraph({ text: "C) Sparrow" }),
          new Paragraph({ text: "D) Eagle" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Hint: Known for its colorful tail feathers and dance in the rain.", italics: true, color: "718096" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Answer: A", bold: true, color: "2B6CB0" }),
            ],
            spacing: { after: 200 },
          }),

          // Question 3
          new Paragraph({
            children: [
              new TextRun({ text: "3. Which planet is known as the Red Planet?", bold: true }),
            ],
            spacing: { before: 150, after: 50 },
          }),
          new Paragraph({ text: "A) Venus" }),
          new Paragraph({ text: "B) Mars" }),
          new Paragraph({ text: "C) Jupiter" }),
          new Paragraph({ text: "D) Saturn" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Hint: It is the fourth planet from the Sun, named after the Roman god of war.", italics: true, color: "718096" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Answer: B", bold: true, color: "2B6CB0" }),
            ],
            spacing: { after: 200 },
          }),

          // Question 4
          new Paragraph({
            children: [
              new TextRun({ text: "4. What is the capital city of France?", bold: true }),
            ],
            spacing: { before: 150, after: 50 },
          }),
          new Paragraph({ text: "A) Rome" }),
          new Paragraph({ text: "B) Berlin" }),
          new Paragraph({ text: "C) Paris" }),
          new Paragraph({ text: "D) Madrid" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Hint: Home to the famous Eiffel Tower and Louvre Museum.", italics: true, color: "718096" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Answer: C", bold: true, color: "2B6CB0" }),
            ],
            spacing: { after: 200 },
          }),

          // Question 5
          new Paragraph({
            children: [
              new TextRun({ text: "5. How many continents are there in the world?", bold: true }),
            ],
            spacing: { before: 150, after: 50 },
          }),
          new Paragraph({ text: "A) 5" }),
          new Paragraph({ text: "B) 6" }),
          new Paragraph({ text: "C) 7" }),
          new Paragraph({ text: "D) 8" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Hint: Asia, Africa, North America, South America, Antarctica, Europe, and Australia.", italics: true, color: "718096" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Answer: C", bold: true, color: "2B6CB0" }),
            ],
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '..', 'sample_mcq_questions.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('Created sample docx with hints at:', outputPath);
}

createSampleDocx().catch(console.error);
