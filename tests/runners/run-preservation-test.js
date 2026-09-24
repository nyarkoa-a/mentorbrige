#!/usr/bin/env node

/**
 * Test Runner for Firebase Functionality Preservation
 * Runs the property-based test to validate existing Firebase functionality
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running Firebase Functionality Preservation Test');
console.log('==================================================');
console.log('IMPORTANT: These tests MUST PASS on unfixed code');
console.log('They validate existing functionality that should be preserved during the fix');
console.log('');

// Import and run the test directly
async function runPreservationTest() {
  try {
    // Import the test module
    const { createPreservationTestPage, runFirebasePreservationTest } = require('../suites/test-preservation-properties.js');
    
    console.log('🔍 Starting Firebase functionality preservation testing...');
    
    // Run the property-based preservation tests
    const propertyTestResult = await runFirebasePreservationTest();
    
    if (propertyTestResult.preservationPassed) {
      console.log('✅ EXPECTED RESULT: All existing functionality preserved');
      console.log('Preservation validated through property-based testing');
      
      return { 
        success: true, 
        preservationPassed: true,
        testMethod: 'property-based'
      };
    }
    
    // If property test detected issues, run detailed analysis
    console.log('⚠️ Property test detected potential preservation issues...');
    console.log('🔍 Running detailed preservation analysis...');
    
    const testResults = {
      firebaseInitOnPages: true,
      authenticationFlows: true,
      servicesConsistency: true,
      sessionPersistence: true,
      noRegressions: true,
      preservationLogs: [],
      issueDetails: []
    };
    
    // Test different page types
    const pagesToTest = ['index', 'student-dashboard', 'settings'];
    
    for (const pageType of pagesToTest) {
      console.log(`🔎 Testing preservation on ${pageType}...`);
      
      try {
        const testPage = await createPreservationTestPage(pageType);
        
        // Test Firebase initialization
        const initTest = await testPage.checkFirebaseInitialization();
        if (!initTest.success) {
          testResults.firebaseInitOnPages = false;
          testResults.issueDetails.push(`Firebase init failed on ${pageType}`);
        }
        testResults.preservationLogs.push(`${pageType} Firebase init: ${initTest.success ? '✅' : '❌'}`);
        
        // Test authentication flow
        const authTest = await testPage.checkAuthenticationFlow('authenticated', 'student');
        if (!authTest.authServiceAvailable || !authTest.redirectsWorking) {
          testResults.authenticationFlows = false;
          testResults.issueDetails.push(`Auth issues on ${pageType}`);
        }
        testResults.preservationLogs.push(`${pageType} Auth flow: ${authTest.authServiceAvailable && authTest.redirectsWorking ? '✅' : '❌'}`);
        
        // Test services consistency
        const servicesTest = await testPage.checkFirebaseServicesConsistency();
        if (!servicesTest.consistent) {
          testResults.servicesConsistency = false;
          testResults.issueDetails.push(`Services inconsistent on ${pageType}`);
        }
        testResults.preservationLogs.push(`${pageType} Services: ${servicesTest.consistent ? '✅' : '❌'}`);
        
        // Test session persistence
        const sessionTest = await testPage.checkSessionPersistence('authenticated');
        if (!sessionTest.working) {
          testResults.sessionPersistence = false;
          testResults.issueDetails.push(`Session persistence issues on ${pageType}`);
        }
        testResults.preservationLogs.push(`${pageType} Sessions: ${sessionTest.working ? '✅' : '❌'}`);
        
        // Check for regressions
        const regressionTest = await testPage.checkForRegressionErrors();
        if (!regressionTest.noRegressions) {
          testResults.noRegressions = false;
          testResults.issueDetails.push(`Regression errors on ${pageType}: ${regressionTest.errors.join(', ')}`);
        }
        testResults.preservationLogs.push(`${pageType} No regressions: ${regressionTest.noRegressions ? '✅' : '❌'}`);
        
        await testPage.cleanup();
        
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Error testing ${pageType}:`, error.message);
        testResults.issueDetails.push(`Error testing ${pageType}: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('📊 PRESERVATION TEST SUMMARY');
    console.log('============================');
    
    // Count preservation areas that passed
    const preservationAreas = [
      { name: 'Firebase initialization on pages', passed: testResults.firebaseInitOnPages },
      { name: 'Authentication flows', passed: testResults.authenticationFlows },
      { name: 'Services consistency', passed: testResults.servicesConsistency },
      { name: 'Session persistence', passed: testResults.sessionPersistence },
      { name: 'No regressions', passed: testResults.noRegressions }
    ];
    
    const passedAreas = preservationAreas.filter(area => area.passed).length;
    const totalAreas = preservationAreas.length;
    
    console.log(`Preservation score: ${passedAreas}/${totalAreas} areas validated`);
    console.log('');
    
    // Report individual preservation areas
    preservationAreas.forEach(area => {
      console.log(`${area.passed ? '✅' : '❌'} ${area.name}`);
    });
    
    console.log('');
    
    // Show detailed logs
    if (testResults.preservationLogs.length > 0) {
      console.log('Detailed preservation results:');
      testResults.preservationLogs.forEach(log => console.log(`  ${log}`));
      console.log('');
    }
    
    if (passedAreas === totalAreas) {
      console.log('🎉 EXPECTED RESULT: PRESERVATION TESTS PASSED');
      console.log('All existing Firebase functionality is working correctly.');
      console.log('This confirms the baseline behavior that must be preserved during the fix.');
      console.log('');
      console.log('✅ Preservation property tests PASSED');
      console.log('(All existing functionality validated and ready for preservation during fix)');
      
      // Document the preservation baseline
      const preservationReport = {
        testTimestamp: new Date().toISOString(),
        preservationScore: `${passedAreas}/${totalAreas}`,
        preservationDetails: {
          firebaseInitOnPages: testResults.firebaseInitOnPages,
          authenticationFlows: testResults.authenticationFlows,
          servicesConsistency: testResults.servicesConsistency,
          sessionPersistence: testResults.sessionPersistence,
          noRegressions: testResults.noRegressions
        },
        preservationLogs: testResults.preservationLogs,
        pagesValidated: pagesToTest,
        status: 'BASELINE_ESTABLISHED'
      };
      
      // Save preservation baseline report
      const fs = require('fs').promises;
      const reportPath = path.join(__dirname, '../reports/preservation-baseline-report.json');
      await fs.writeFile(
        reportPath, 
        JSON.stringify(preservationReport, null, 2)
      );
      
      console.log(`📝 Preservation baseline documented in: ${reportPath}`);
      
      return { success: true, preservationPassed: true, preservationScore: passedAreas };
      
    } else {
      console.log('⚠️ PRESERVATION ISSUES DETECTED');
      console.log('Some existing functionality may have issues that need attention:');
      console.log('');
      
      if (testResults.issueDetails.length > 0) {
        console.log('Issues found:');
        testResults.issueDetails.forEach(issue => console.log(`• ${issue}`));
        console.log('');
      }
      
      console.log('❌ Preservation property tests revealed baseline issues');
      console.log('These should be addressed to establish a clean baseline before applying the fix');
      
      return { success: false, preservationPassed: false, issues: testResults.issueDetails };
    }
    
  } catch (error) {
    console.error('');
    console.error('💥 PRESERVATION TEST EXECUTION ERROR');
    console.error('===================================');
    console.error('Error during preservation test execution:');
    console.error(error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    
    return { success: false, error: error.message };
  }
}

// Run the test
runPreservationTest()
  .then(result => {
    console.log('');
    console.log('🏁 Preservation test execution completed');
    
    if (result.success && result.preservationPassed) {
      console.log(`✅ Successfully validated existing Firebase functionality (${result.preservationScore || 'full'} preservation)`);
      process.exit(0); // Success - existing functionality preserved
    } else if (result.success && !result.preservationPassed) {
      console.log('⚠️ Existing functionality has issues that need attention before fix');
      process.exit(1); // Issues found - need to address baseline problems
    } else {
      console.log('❌ Preservation test execution failed');
      process.exit(1); // Test failed to run
    }
  })
  .catch(error => {
    console.error('');
    console.error('💥 FATAL ERROR');
    console.error('==============');
    console.error('Failed to run preservation test:');
    console.error(error.message);
    process.exit(1);
  });