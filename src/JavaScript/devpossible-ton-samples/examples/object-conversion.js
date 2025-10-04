/**
 * Object Conversion Example
 * Copyright (c) 2024 DevPossible, LLC
 */

import * as ton from '../../devpossible-ton/dist/index.esm.js';

export async function run() {
  console.log('=== Object Conversion Example ===\n');

  // Example 1: Convert JavaScript object to TON
  console.log('1. Converting JavaScript object to TON:');
  const user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    age: 35,
    isActive: true,
    createdAt: new Date().toISOString(),
    roles: ['admin', 'developer', 'reviewer'],
    address: {
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      country: 'USA'
    }
  };

  const tonDoc = new ton.TonDocument();
  tonDoc.setRoot(user);
  
  console.log('   User converted to TON document');
  console.log(`   Name: ${user.firstName} ${user.lastName}`);
  console.log(`   Has Address: ${user.address !== null}`);

  // Example 2: Serialize the converted object
  console.log('\n2. Serializing the converted object:');
  const serializer = new ton.TonSerializer();
  const tonString = serializer.serialize(tonDoc);
  
  console.log('   TON Output:');
  tonString.split('\n').forEach(line => console.log('   ' + line));

  // Example 3: Convert TON back to JavaScript object
  console.log('\n3. Converting TON back to JavaScript object:');
  const parser = new ton.TonParser();
  const parsedDoc = parser.parse(tonString);
  const reconstructedUser = parsedDoc.toJSON();

  console.log(`   Reconstructed User: ${reconstructedUser.firstName} ${reconstructedUser.lastName}`);
  console.log(`   Email: ${reconstructedUser.email}`);
  console.log(`   Age: ${reconstructedUser.age}`);
  console.log(`   Active: ${reconstructedUser.isActive}`);
  console.log(`   Roles Count: ${reconstructedUser.roles?.length}`);
  console.log(`   City: ${reconstructedUser.address?.city}`);

  // Example 4: Partial object conversion
  console.log('\n4. Partial object conversion:');
  const partialTon = `{
    firstName = 'Jane',
    email = 'jane@example.com',
    roles = ['user', 'editor']
  }`;

  const partialDoc = parser.parse(partialTon);
  const partialUser = partialDoc.toJSON();

  console.log(`   Partial User: ${partialUser.firstName}`);
  console.log(`   Email: ${partialUser.email}`);
  console.log(`   Age (undefined): ${partialUser.age}`);
  console.log(`   Roles: ${partialUser.roles?.join(', ')}`);

  // Example 5: Object with arrays
  console.log('\n5. Object with arrays:');
  const settings = {
    theme: 'dark',
    fontSize: 14,
    autoSave: true,
    plugins: ['spell-check', 'formatter', 'linter'],
    shortcuts: {
      save: 'Ctrl+S',
      find: 'Ctrl+F',
      replace: 'Ctrl+H'
    }
  };

  const settingsDoc = new ton.TonDocument();
  settingsDoc.setRoot(settings);
  
  console.log('   Settings object created');
  
  const settingsTon = serializer.serialize(settingsDoc);
  const settingsBack = parser.parse(settingsTon).toJSON();
  
  console.log(`   Theme: ${settingsBack.theme}`);
  console.log(`   Font Size: ${settingsBack.fontSize}`);
  console.log(`   Plugins: ${settingsBack.plugins?.join(', ')}`);

  // Example 6: Complex nested structures
  console.log('\n6. Complex nested structures:');
  const company = {
    name: 'Tech Corp',
    founded: 2020,
    employees: [
      { name: 'Alice', role: 'CEO', department: 'Executive' },
      { name: 'Bob', role: 'CTO', department: 'Engineering' },
      { name: 'Charlie', role: 'Developer', department: 'Engineering' }
    ],
    offices: {
      headquarters: { city: 'New York', country: 'USA' },
      branch: { city: 'London', country: 'UK' }
    }
  };

  const companyDoc = new ton.TonDocument();
  companyDoc.setRoot(company);
  const companyTon = serializer.serialize(companyDoc);
  
  console.log('   Company structure serialized');
  const companyBack = parser.parse(companyTon).toJSON();
  console.log(`   Company: ${companyBack.name} (${companyBack.founded})`);
  console.log(`   Employees: ${companyBack.employees?.length}`);
  console.log(`   Offices: ${Object.keys(companyBack.offices || {}).length} locations`);
}
