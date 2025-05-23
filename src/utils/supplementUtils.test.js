// Manual test for supplementUtils.ts
// Run this file with Node.js to test the utility functions

import { 
  formatExpirationDate, 
  toISODateString, 
  getFormulationLabel, 
  getCertificationLabel,
  getFormulationTypes,
  getCertificationTypes
} from './supplementUtils.js';

// Test formatExpirationDate
console.log('Testing formatExpirationDate:');
console.log('ISO date:', formatExpirationDate('2025-12-31T00:00:00.000Z'));
console.log('undefined:', formatExpirationDate(undefined));
console.log('invalid date:', formatExpirationDate('invalid-date'));
console.log('different format:', formatExpirationDate('2025/12/31'));
console.log();

// Test toISODateString
console.log('Testing toISODateString:');
console.log('Date object:', toISODateString(new Date('2025-12-31T00:00:00.000Z')));
console.log('date string:', toISODateString('2025-12-31'));
console.log('undefined:', toISODateString(undefined));
console.log('invalid date:', toISODateString('invalid-date'));
console.log();

// Test getFormulationTypes
console.log('Testing getFormulationTypes:');
const types = getFormulationTypes();
console.log('Types array:', types);
console.log('First type:', types[0]);
console.log();

// Test getCertificationTypes
console.log('Testing getCertificationTypes:');
const certTypes = getCertificationTypes();
console.log('Certification types array:', certTypes);
console.log('First certification type:', certTypes[0]);
console.log();

// Test getFormulationLabel
console.log('Testing getFormulationLabel:');
console.log('extended-release:', getFormulationLabel('extended-release'));
console.log('unknown-type:', getFormulationLabel('unknown-type'));
console.log('undefined:', getFormulationLabel(undefined));
console.log();

// Test getCertificationLabel
console.log('Testing getCertificationLabel:');
console.log('usp:', getCertificationLabel('usp'));
console.log('unknown-cert:', getCertificationLabel('unknown-cert'));
console.log('undefined:', getCertificationLabel(undefined));
