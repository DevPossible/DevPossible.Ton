/**
 * Complex Document Example
 * Copyright (c) 2024 DevPossible, LLC
 */

import * as ton from '../../devpossible-ton/dist/index.esm.js';

export async function run() {
  console.log('=== Complex Document Example ===\n');

  // Example 1: Multi-level nested structure
  console.log('1. Multi-level nested structure:');
  const complexData = {
    company: 'Tech Solutions Inc.',
    departments: [
      {
        name: 'Engineering',
        manager: 'Alice Johnson',
        teams: [
          {
            name: 'Backend',
            members: ['Bob', 'Charlie', 'David'],
            tech: ['Node.js', 'Python', 'Go']
          },
          {
            name: 'Frontend',
            members: ['Eve', 'Frank'],
            tech: ['React', 'TypeScript', 'CSS']
          }
        ]
      },
      {
        name: 'Sales',
        manager: 'Grace Wilson',
        regions: ['North', 'South', 'East', 'West']
      }
    ],
    metadata: {
      created: new Date().toISOString(),
      version: '3.0',
      tags: ['production', 'verified']
    }
  };

  const doc = new ton.TonDocument();
  doc.setRoot(complexData);
  
  const serializer = new ton.TonSerializer();
  const serialized = serializer.serialize(doc);
  
  console.log('   Complex structure created and serialized');
  console.log(`   Total length: ${serialized.length} characters`);
  console.log(`   Departments: ${complexData.departments.length}`);

  // Example 2: Parse and navigate complex document
  console.log('\n2. Parsing and navigating complex document:');
  const parser = new ton.TonParser();
  const parsed = parser.parse(serialized);
  const data = parsed.toJSON();
  
  console.log(`   Company: ${data.company}`);
  console.log(`   First department: ${data.departments[0].name}`);
  console.log(`   First team: ${data.departments[0].teams[0].name}`);
  console.log(`   Backend tech stack: ${data.departments[0].teams[0].tech.join(', ')}`);

  // Example 3: Mixed data types in arrays
  console.log('\n3. Mixed data types and structures:');
  const mixedTon = `{
    items = [
      'string',
      42,
      true,
      { type = 'object', value = 100 },
      [1, 2, 3]
    ],
    settings = {
      feature_flags = {
        new_ui = true,
        beta_api = false,
        experimental = true
      }
    }
  }`;
  
  const mixedDoc = parser.parse(mixedTon);
  const mixedData = mixedDoc.toJSON();
  
  console.log(`   Items array length: ${mixedData.items.length}`);
  console.log(`   Item types: ${mixedData.items.map(i => typeof i).join(', ')}`);
  console.log(`   Feature flags count: ${Object.keys(mixedData.settings.feature_flags).length}`);

  // Example 4: Large document summary
  console.log('\n4. Large document with statistics:');
  const stats = {
    users: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `User${i + 1}`,
      active: i % 2 === 0
    })),
    metrics: {
      total: 10,
      active: 5,
      inactive: 5
    }
  };
  
  const statsDoc = new ton.TonDocument();
  statsDoc.setRoot(stats);
  const statsStr = serializer.serialize(statsDoc);
  
  console.log(`   Generated ${stats.users.length} users`);
  console.log(`   Document size: ${statsStr.length} characters`);
  console.log(`   Active users: ${stats.metrics.active}`);
}
