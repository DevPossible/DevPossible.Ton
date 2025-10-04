/**
 * DevPossible.Ton JavaScript Sample Programs
 * Copyright (c) 2024 DevPossible, LLC
 */

import * as readline from 'readline';
import * as arrayOperations from './examples/array-operations.js';
import * as fileOperations from './examples/file-operations.js';
import * as schemaValidation from './examples/schema-validation.js';
import * as objectConversion from './examples/object-conversion.js';
import * as advancedSerialization from './examples/advanced-serialization.js';
import * as errorHandling from './examples/error-handling.js';
import * as complexDocument from './examples/complex-document.js';
import * as performanceTest from './examples/performance-test.js';

// Change to samples directory
process.chdir(new URL('.', import.meta.url).pathname.substring(1));

function displayMenu() {
  console.clear();
  console.log('============================================');
  console.log('  DevPossible.Ton Library Sample Programs  ');
  console.log('============================================\n');
  console.log('Select a sample to run:');
  console.log('1. Basic Usage - Parse simple TON content');
  console.log('2. File Operations - Read and write TON files');
  console.log('3. Object Conversion - Convert objects to/from TON');
  console.log('4. Schema Validation - Validate TON with schemas');
  console.log('5. Array Operations - Work with arrays in TON');
  console.log('6. Advanced Serialization - Serialization options');
  console.log('7. Complex Document - Complex nested structures');
  console.log('8. Error Handling - Handle errors and edge cases');
  console.log('9. Performance Test - Performance benchmarks');
  console.log('0. Exit');
  console.log();
}

async function runBasicUsage() {
  // Import dynamically to avoid module loading issues
  const { default: basicUsage } = await import('./basic-usage.js');
}

async function runSample(choice) {
  console.clear();
  
  try {
    switch (choice) {
      case '1':
        console.log('Running Basic Usage sample...\n');
        await import('./basic-usage.js');
        break;
      case '2':
        await fileOperations.run();
        break;
      case '3':
        await objectConversion.run();
        break;
      case '4':
        await schemaValidation.run();
        break;
      case '5':
        await arrayOperations.run();
        break;
      case '6':
        await advancedSerialization.run();
        break;
      case '7':
        await complexDocument.run();
        break;
      case '8':
        await errorHandling.run();
        break;
      case '9':
        await performanceTest.run();
        break;
      case '0':
        console.log('Exiting samples. Thank you!');
        return false;
      default:
        console.log('Invalid choice. Please try again.');
        break;
    }
  } catch (error) {
    console.error('\nError:', error.message);
  }
  
  return true;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

  let continueRunning = true;

  while (continueRunning) {
    displayMenu();
    const choice = await question('Enter your choice: ');
    
    continueRunning = await runSample(choice);
    
    if (continueRunning) {
      console.log('\nPress any key to continue...');
      await question('');
    }
  }

  rl.close();
}

main().catch(console.error);
