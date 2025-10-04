/**
 * File Operations Example
 * Copyright (c) 2024 DevPossible, LLC
 */

import * as ton from '../../devpossible-ton/dist/index.esm.js';
import fs from 'fs';
import path from 'path';

export async function run() {
  console.log('=== File Operations Example ===\n');

  // Example 1: Read TON file
  console.log('1. Reading TON file:');
  const simplePath = path.join(process.cwd(), 'SampleData', 'simple.ton');
  
  try {
    const content = fs.readFileSync(simplePath, 'utf8');
    const parser = new ton.TonParser();
    const document = parser.parse(content);
    
    console.log('   File read successfully!');
    console.log('   Content:', JSON.stringify(document.toJSON(), null, 2));
  } catch (error) {
    console.log('   Error reading file:', error.message);
  }

  // Example 2: Write TON file
  console.log('\n2. Writing TON file:');
  const outputPath = path.join(process.cwd(), 'SampleData', 'output.ton');
  
  const data = {
    application: 'Sample App',
    version: '2.0.0',
    settings: {
      theme: 'dark',
      language: 'en',
      notifications: true
    },
    features: ['analytics', 'reporting', 'export']
  };

  const doc = new ton.TonDocument();
  doc.setRoot(data);
  
  const serializer = new ton.TonSerializer();
  const tonContent = serializer.serialize(doc);
  
  try {
    fs.writeFileSync(outputPath, tonContent, 'utf8');
    console.log('   File written successfully to:', outputPath);
  } catch (error) {
    console.log('   Error writing file:', error.message);
  }

  // Example 3: Read and modify
  console.log('\n3. Read, modify, and save:');
  const configPath = path.join(process.cwd(), 'SampleData', 'config.ton');
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const parser = new ton.TonParser();
    const configDoc = parser.parse(configContent);
    
    console.log('   Original config loaded');
    
    // Modify the document
    const root = configDoc.getRoot();
    root.set('modified', new Date().toISOString());
    root.set('version', '1.0.1');
    
    // Save modified version
    const modifiedPath = path.join(process.cwd(), 'SampleData', 'config-modified.ton');
    const modifiedContent = serializer.serialize(configDoc);
    fs.writeFileSync(modifiedPath, modifiedContent, 'utf8');
    
    console.log('   Modified config saved to:', modifiedPath);
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // Example 4: Batch processing
  console.log('\n4. Batch file processing:');
  const sampleDir = path.join(process.cwd(), 'SampleData');
  
  try {
    const files = fs.readdirSync(sampleDir)
      .filter(f => f.endsWith('.ton'));
    
    console.log(`   Found ${files.length} TON files:`);
    
    const parser = new ton.TonParser();
    files.forEach(file => {
      try {
        const filePath = path.join(sampleDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const document = parser.parse(content);
        console.log(`     ✓ ${file} - Valid TON file`);
      } catch (error) {
        console.log(`     ✗ ${file} - Parse error: ${error.message}`);
      }
    });
  } catch (error) {
    console.log('   Error reading directory:', error.message);
  }
}
