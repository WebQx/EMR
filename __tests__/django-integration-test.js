/**
 * WebQX Django Integration Test
 * 
 * Comprehensive testing of Django authentication backend including:
 * - Authentication endpoints
 * - User management
 * - OAuth2 integration
 * - Security features
 * - API functionality
 */

const axios = require('axios').default;

class DjangoIntegrationTester {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.testResults = [];
        this.authToken = null;
        this.refreshToken = null;
    }

    async runAllTests() {
        console.log('🐍 Starting Django Integration Tests\n');

        const testSuites = [
            { name: 'Health Check', test: () => this.testHealthCheck() },
            { name: 'User Registration', test: () => this.testUserRegistration() },
            { name: 'User Authentication', test: () => this.testUserAuthentication() },
            { name: 'Token Refresh', test: () => this.testTokenRefresh() },
            { name: 'Protected Endpoints', test: () => this.testProtectedEndpoints() },
            { name: 'OAuth2 Endpoints', test: () => this.testOAuth2Endpoints() },
            { name: 'Role-Based Access', test: () => this.testRoleBasedAccess() },
            { name: 'Security Features', test: () => this.testSecurityFeatures() },
            { name: 'Rate Limiting', test: () => this.testRateLimiting() },
            { name: 'Error Handling', test: () => this.testErrorHandling() },
            { name: 'CORS Configuration', test: () => this.testCORSConfiguration() },
            { name: 'API Performance', test: () => this.testAPIPerformance() }
        ];

        for (const suite of testSuites) {
            await this.runTestSuite(suite.name, suite.test);
        }

        this.generateTestReport();
        return this.testResults;
    }

    async runTestSuite(suiteName, testFunction) {
        console.log(`Testing: 🧪 ${suiteName}`);
        const startTime = Date.now();

        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                suite: suiteName,
                status: 'PASSED',
                duration,
                details: result,
                timestamp: new Date().toISOString()
            });

            console.log(`✅ ${suiteName} - PASSED (${duration}ms)`);
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.testResults.push({
                suite: suiteName,
                status: 'FAILED',
                duration,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            console.log(`❌ ${suiteName} - FAILED: ${error.message}`);
        }
    }

    // Test Health Check Endpoint
    async testHealthCheck() {
        const response = await axios.get(`${this.baseUrl}/health/`);
        
        if (response.status !== 200) {
            throw new Error(`Health check failed with status ${response.status}`);
        }

        const data = response.data;
        if (!data.status || data.status !== 'healthy') {
            throw new Error('Health check returned unhealthy status');
        }

        return {
            status: data.status,
            version: data.version,
            service: data.service,
            usersCount: data.users_count,
            oauthEnabled: data.oauth_enabled
        };
    }

    // Test User Registration
    async testUserRegistration() {
        const testUser = {
            email: `test.user.${Date.now()}@webqx.com`,
            password: 'TestPassword123!',
            password_confirm: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            user_type: 'PATIENT',
            terms_accepted: true,
            privacy_policy_accepted: true,
            hipaa_authorization: true
        };

        const response = await axios.post(`${this.baseUrl}/api/v1/auth/register/`, testUser);
        
        if (response.status !== 201) {
            throw new Error(`Registration failed with status ${response.status}`);
        }

        const data = response.data;
        if (!data.access_token || !data.user) {
            throw new Error('Registration response missing required fields');
        }

        // Store token for later tests
        this.authToken = data.access_token;
        this.refreshToken = data.refresh_token;

        return {
            userId: data.user.id,
            email: data.user.email,
            userType: data.user.user_type,
            tokenReceived: !!data.access_token
        };
    }

    // Test User Authentication
    async testUserAuthentication() {
        // Test with demo user
        const loginData = {
            email: 'demo@patient.com',
            password: 'patient123',
            user_type: 'PATIENT'
        };

        const response = await axios.post(`${this.baseUrl}/api/v1/auth/token/`, loginData);
        
        if (response.status !== 200) {
            throw new Error(`Authentication failed with status ${response.status}`);
        }

        const data = response.data;
        if (!data.access_token || !data.user) {
            throw new Error('Authentication response missing required fields');
        }

        // Test invalid credentials
        try {
            await axios.post(`${this.baseUrl}/api/v1/auth/token/`, {
                email: 'invalid@user.com',
                password: 'wrongpassword'
            });
            throw new Error('Invalid credentials should have been rejected');
        } catch (error) {
            if (error.response?.status !== 401) {
                throw new Error('Invalid credentials test failed');
            }
        }

        return {
            userId: data.user.id,
            email: data.user.email,
            userType: data.user.user_type,
            roleInfo: data.role_info,
            tokenType: data.token_type,
            expiresIn: data.expires_in
        };
    }

    // Test Token Refresh
    async testTokenRefresh() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available for testing');
        }

        const response = await axios.post(`${this.baseUrl}/api/v1/auth/refresh/`, {
            refresh_token: this.refreshToken
        });
        
        if (response.status !== 200) {
            throw new Error(`Token refresh failed with status ${response.status}`);
        }

        const data = response.data;
        if (!data.access_token) {
            throw new Error('Token refresh response missing access token');
        }

        // Update stored token
        this.authToken = data.access_token;

        return {
            newTokenReceived: !!data.access_token,
            tokenType: data.token_type,
            expiresIn: data.expires_in
        };
    }

    // Test Protected Endpoints
    async testProtectedEndpoints() {
        if (!this.authToken) {
            throw new Error('No auth token available for testing protected endpoints');
        }

        // Test /me endpoint
        const response = await axios.get(`${this.baseUrl}/api/v1/auth/me/`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });
        
        if (response.status !== 200) {
            throw new Error(`Protected endpoint failed with status ${response.status}`);
        }

        const data = response.data;
        if (!data.user || !data.role_info) {
            throw new Error('Protected endpoint response missing required fields');
        }

        // Test without token (should fail)
        try {
            await axios.get(`${this.baseUrl}/api/v1/auth/me/`);
            throw new Error('Protected endpoint should require authentication');
        } catch (error) {
            if (error.response?.status !== 401) {
                throw new Error('Protected endpoint authentication test failed');
            }
        }

        return {
            userDataRetrieved: !!data.user,
            roleInfoRetrieved: !!data.role_info,
            permissionsRetrieved: !!data.permissions,
            authenticationRequired: true
        };
    }

    // Test OAuth2 Endpoints
    async testOAuth2Endpoints() {
        // Test Google OAuth redirect
        const googleResponse = await axios.get(`${this.baseUrl}/auth/google`, {
            maxRedirects: 0,
            validateStatus: (status) => status === 302
        });
        
        if (googleResponse.status !== 302) {
            throw new Error('Google OAuth redirect failed');
        }

        // Test Microsoft OAuth redirect
        const microsoftResponse = await axios.get(`${this.baseUrl}/auth/microsoft`, {
            maxRedirects: 0,
            validateStatus: (status) => status === 302
        });
        
        if (microsoftResponse.status !== 302) {
            throw new Error('Microsoft OAuth redirect failed');
        }

        return {
            googleOAuthAvailable: googleResponse.status === 302,
            microsoftOAuthAvailable: microsoftResponse.status === 302,
            redirectsWorking: true
        };
    }

    // Test Role-Based Access Control
    async testRoleBasedAccess() {
        // Test different user types
        const userTypes = ['PATIENT', 'PHYSICIAN', 'ADMINISTRATOR'];
        const results = {};

        for (const userType of userTypes) {
            try {
                const response = await axios.post(`${this.baseUrl}/api/v1/auth/token/`, {
                    email: this.getTestEmailForUserType(userType),
                    password: this.getTestPasswordForUserType(userType)
                });

                if (response.status === 200) {
                    results[userType] = {
                        loginSuccessful: true,
                        roleInfo: response.data.role_info,
                        permissions: response.data.role_info?.permissions || []
                    };
                }
            } catch (error) {
                results[userType] = {
                    loginSuccessful: false,
                    error: error.response?.data?.error || error.message
                };
            }
        }

        return results;
    }

    getTestEmailForUserType(userType) {
        const emails = {
            'PATIENT': 'demo@patient.com',
            'PHYSICIAN': 'physician@webqx.com',
            'ADMINISTRATOR': 'admin@webqx.com'
        };
        return emails[userType] || 'demo@patient.com';
    }

    getTestPasswordForUserType(userType) {
        const passwords = {
            'PATIENT': 'patient123',
            'PHYSICIAN': 'demo123',
            'ADMINISTRATOR': 'admin123'
        };
        return passwords[userType] || 'patient123';
    }

    // Test Security Features
    async testSecurityFeatures() {
        const securityTests = {};

        // Test password strength validation
        try {
            await axios.post(`${this.baseUrl}/api/v1/auth/register/`, {
                email: 'weak.password@test.com',
                password: '123',
                password_confirm: '123',
                first_name: 'Test',
                last_name: 'User',
                terms_accepted: true,
                privacy_policy_accepted: true
            });
            securityTests.passwordStrength = false;
        } catch (error) {
            securityTests.passwordStrength = error.response?.status === 400;
        }

        // Test email validation
        try {
            await axios.post(`${this.baseUrl}/api/v1/auth/register/`, {
                email: 'invalid-email',
                password: 'ValidPassword123!',
                password_confirm: 'ValidPassword123!',
                first_name: 'Test',
                last_name: 'User',
                terms_accepted: true,
                privacy_policy_accepted: true
            });
            securityTests.emailValidation = false;
        } catch (error) {
            securityTests.emailValidation = error.response?.status === 400;
        }

        // Test CORS headers
        const corsResponse = await axios.options(`${this.baseUrl}/api/v1/auth/token/`);
        securityTests.corsEnabled = corsResponse.headers['access-control-allow-origin'] !== undefined;

        return securityTests;
    }

    // Test Rate Limiting
    async testRateLimiting() {
        const requests = [];
        const testEmail = 'rate.limit.test@webqx.com';

        // Make multiple rapid requests to trigger rate limiting
        for (let i = 0; i < 12; i++) {
            requests.push(
                axios.post(`${this.baseUrl}/api/v1/auth/token/`, {
                    email: testEmail,
                    password: 'wrongpassword'
                }).catch(error => error.response)
            );
        }

        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(r => r?.status === 429);

        return {
            totalRequests: requests.length,
            rateLimitedRequests: rateLimitedResponses.length,
            rateLimitingActive: rateLimitedResponses.length > 0
        };
    }

    // Test Error Handling
    async testErrorHandling() {
        const errorTests = {};

        // Test 404 for non-existent endpoint
        try {
            await axios.get(`${this.baseUrl}/api/v1/nonexistent/`);
            errorTests.notFoundHandling = false;
        } catch (error) {
            errorTests.notFoundHandling = error.response?.status === 404;
        }

        // Test malformed JSON
        try {
            await axios.post(`${this.baseUrl}/api/v1/auth/token/`, 'invalid json', {
                headers: { 'Content-Type': 'application/json' }
            });
            errorTests.malformedJsonHandling = false;
        } catch (error) {
            errorTests.malformedJsonHandling = error.response?.status === 400;
        }

        // Test missing required fields
        try {
            await axios.post(`${this.baseUrl}/api/v1/auth/token/`, {});
            errorTests.missingFieldsHandling = false;
        } catch (error) {
            errorTests.missingFieldsHandling = error.response?.status === 400;
        }

        return errorTests;
    }

    // Test CORS Configuration
    async testCORSConfiguration() {
        const response = await axios.options(`${this.baseUrl}/api/v1/auth/token/`, {
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });

        const corsHeaders = {
            allowOrigin: response.headers['access-control-allow-origin'],
            allowMethods: response.headers['access-control-allow-methods'],
            allowHeaders: response.headers['access-control-allow-headers'],
            allowCredentials: response.headers['access-control-allow-credentials']
        };

        return {
            corsConfigured: !!corsHeaders.allowOrigin,
            allowsLocalhost: corsHeaders.allowOrigin?.includes('localhost'),
            allowsCredentials: corsHeaders.allowCredentials === 'true',
            corsHeaders
        };
    }

    // Test API Performance
    async testAPIPerformance() {
        const performanceTests = {};

        // Test health check response time
        const healthStart = Date.now();
        await axios.get(`${this.baseUrl}/health/`);
        performanceTests.healthCheckTime = Date.now() - healthStart;

        // Test authentication response time
        const authStart = Date.now();
        await axios.post(`${this.baseUrl}/api/v1/auth/token/`, {
            email: 'demo@patient.com',
            password: 'patient123'
        });
        performanceTests.authenticationTime = Date.now() - authStart;

        // Test concurrent requests
        const concurrentStart = Date.now();
        const concurrentRequests = Array(5).fill().map(() => 
            axios.get(`${this.baseUrl}/health/`)
        );
        await Promise.all(concurrentRequests);
        performanceTests.concurrentRequestsTime = Date.now() - concurrentStart;

        return {
            healthCheckTime: performanceTests.healthCheckTime,
            authenticationTime: performanceTests.authenticationTime,
            concurrentRequestsTime: performanceTests.concurrentRequestsTime,
            averageResponseTime: (performanceTests.healthCheckTime + performanceTests.authenticationTime) / 2
        };
    }

    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'PASSED').length;
        const failedTests = totalTests - passedTests;
        const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

        console.log('\n📊 DJANGO INTEGRATION TEST REPORT');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        console.log(`Total Duration: ${totalDuration}ms`);
        console.log(`Average Duration: ${(totalDuration / totalTests).toFixed(1)}ms`);

        console.log('\nDETAILED RESULTS:');
        console.log('-'.repeat(60));
        this.testResults.forEach(result => {
            const status = result.status === 'PASSED' ? '✅' : '❌';
            console.log(`${status} ${result.suite} (${result.duration}ms)`);
            if (result.error) {
                console.log(`    Error: ${result.error}`);
            }
        });

        console.log('\n' + '='.repeat(60));
        console.log('Django integration testing completed');
    }
}

// Main test execution
async function runDjangoIntegrationTest() {
    console.log('🚀 Starting WebQX Django Integration Test\n');

    const tester = new DjangoIntegrationTester();

    try {
        const results = await tester.runAllTests();
        return results;
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        throw error;
    }
}

// Export for use in other test files
module.exports = {
    DjangoIntegrationTester,
    runDjangoIntegrationTest
};

// Run tests if this file is executed directly
if (require.main === module) {
    runDjangoIntegrationTest();
}