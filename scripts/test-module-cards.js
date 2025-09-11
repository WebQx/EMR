#!/usr/bin/env node

/**
 * WebQX Module Placement Cards Test Runner
 * 
 * Executes comprehensive tests for all module placement cards
 * in patient and provider panels with EMR integration
 */

const path = require('path');
const { spawn } = require('child_process');

// Test configuration
const TEST_CONFIG = {
  testFile: path.join(__dirname, '..', '__tests__', 'module-placement-cards-emr-test.js'),
  timeout: 60000, // 60 seconds
  verbose: true
};

class TestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async run() {
    console.log('🚀 WebQX Module Placement Cards Test Runner');
    console.log('=' .repeat(50));
    console.log(`Test File: ${TEST_CONFIG.testFile}`);
    console.log(`Timeout: ${TEST_CONFIG.timeout}ms`);
    console.log(`Started: ${new Date().toISOString()}\n`);

    try {
      // Check if test file exists
      const fs = require('fs');
      if (!fs.existsSync(TEST_CONFIG.testFile)) {
        throw new Error(`Test file not found: ${TEST_CONFIG.testFile}`);
      }

      // Run the test
      await this.executeTest();
      
      // Generate summary
      this.generateSummary();

    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  }

  async executeTest() {
    return new Promise((resolve, reject) => {
      console.log('📋 Executing module placement cards test...\n');

      // Spawn Node.js process to run the test
      const testProcess = spawn('node', [TEST_CONFIG.testFile], {
        stdio: 'pipe',
        cwd: path.dirname(TEST_CONFIG.testFile)
      });

      let stdout = '';
      let stderr = '';

      // Capture stdout
      testProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        if (TEST_CONFIG.verbose) {
          process.stdout.write(output);
        }
      });

      // Capture stderr
      testProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        if (TEST_CONFIG.verbose) {
          process.stderr.write(error);
        }
      });

      // Handle process completion
      testProcess.on('close', (code) => {
        if (code === 0) {
          this.parseTestResults(stdout);
          resolve();
        } else {
          reject(new Error(`Test process exited with code ${code}\nStderr: ${stderr}`));
        }
      });

      // Handle process error
      testProcess.on('error', (error) => {
        reject(new Error(`Failed to start test process: ${error.message}`));
      });

      // Set timeout
      setTimeout(() => {
        testProcess.kill('SIGTERM');
        reject(new Error(`Test timed out after ${TEST_CONFIG.timeout}ms`));
      }, TEST_CONFIG.timeout);
    });
  }

  parseTestResults(output) {
    // Parse test output to extract results
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Total Tests:')) {
        const match = line.match(/Total Tests: (\d+)/);
        if (match) this.results.total = parseInt(match[1]);
      }
      
      if (line.includes('Passed:')) {
        const match = line.match(/Passed: (\d+)/);
        if (match) this.results.passed = parseInt(match[1]);
      }
      
      if (line.includes('Failed:')) {
        const match = line.match(/Failed: (\d+)/);
        if (match) this.results.failed = parseInt(match[1]);
      }
      
      if (line.includes('❌') && line.includes('FAILED:')) {
        this.results.errors.push(line.trim());
      }
    }
  }

  generateSummary() {
    const duration = Date.now() - this.startTime;
    const successRate = this.results.total > 0 
      ? ((this.results.passed / this.results.total) * 100).toFixed(1)
      : 0;

    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RUNNER SUMMARY');
    console.log('='.repeat(50));
    console.log(`Duration: ${duration}ms`);
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${successRate}%`);

    if (this.results.errors.length > 0) {
      console.log('\nERRORS:');
      this.results.errors.forEach(error => {
        console.log(`  ${error}`);
      });
    }

    console.log('\nTEST CATEGORIES COVERED:');
    console.log('  ✅ Patient Portal Module Cards');
    console.log('  ✅ Provider Portal Module Cards');
    console.log('  ✅ EMR Integration (OpenEMR, FHIR)');
    console.log('  ✅ Specialty Modules (12 specialties)');
    console.log('  ✅ Real-time Updates');
    console.log('  ✅ Error Handling');
    console.log('  ✅ Interoperability Features');

    console.log('\nMODULE CARDS TESTED:');
    console.log('  Patient Portal:');
    console.log('    📅 Appointments');
    console.log('    📋 Medical Records');
    console.log('    💊 Prescriptions');
    console.log('    🧪 Lab Results');
    console.log('    🎥 Telehealth');
    console.log('    💬 Messages');
    
    console.log('  Provider Portal:');
    console.log('    🏥 OpenEMR Patient Management');
    console.log('    📅 OpenEMR Scheduling');
    console.log('    📋 OpenEMR Clinical Data');
    console.log('    📹 Telehealth Console');
    console.log('    💊 Prescription Management');
    console.log('    🧠 Clinical Decision Support');

    console.log('\n' + '='.repeat(50));
    console.log(`Completed: ${new Date().toISOString()}`);

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Additional test utilities
class TestUtilities {
  static async checkDependencies() {
    console.log('🔍 Checking test dependencies...');
    
    const requiredModules = [
      'jsdom',
      'fs',
      'path'
    ];

    for (const module of requiredModules) {
      try {
        require.resolve(module);
        console.log(`  ✅ ${module}`);
      } catch (error) {
        console.log(`  ❌ ${module} - Not found`);
        return false;
      }
    }
    
    console.log('✅ All dependencies available\n');
    return true;
  }

  static async setupTestEnvironment() {
    console.log('🛠️  Setting up test environment...');
    
    // Set environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.WEBQX_TEST_MODE = 'true';
    process.env.EMR_MOCK_MODE = 'true';
    
    console.log('  ✅ Environment variables set');
    console.log('  ✅ Test mode enabled');
    console.log('  ✅ EMR mock mode enabled\n');
  }

  static generateTestReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'Module Placement Cards EMR Communication',
      results: results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    // Save report to file
    const fs = require('fs');
    const reportPath = path.join(__dirname, '..', 'test-reports', 'module-cards-test-report.json');
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Test report saved: ${reportPath}`);
  }
}

// Main execution
async function main() {
  try {
    // Check dependencies
    const depsOk = await TestUtilities.checkDependencies();
    if (!depsOk) {
      console.error('❌ Missing required dependencies');
      process.exit(1);
    }

    // Setup test environment
    await TestUtilities.setupTestEnvironment();

    // Run tests
    const runner = new TestRunner();
    await runner.run();

  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
WebQX Module Placement Cards Test Runner

Usage: node test-module-cards.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Enable verbose output
  --timeout <ms> Set test timeout (default: 60000ms)

Examples:
  node test-module-cards.js
  node test-module-cards.js --verbose
  node test-module-cards.js --timeout 120000
  `);
  process.exit(0);
}

if (process.argv.includes('--verbose') || process.argv.includes('-v')) {
  TEST_CONFIG.verbose = true;
}

const timeoutIndex = process.argv.findIndex(arg => arg === '--timeout');
if (timeoutIndex !== -1 && process.argv[timeoutIndex + 1]) {
  TEST_CONFIG.timeout = parseInt(process.argv[timeoutIndex + 1]);
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  TestRunner,
  TestUtilities,
  TEST_CONFIG
};