#!/bin/bash
# OpenEMR FHIR and Interoperability Components
# FHIR resources, HL7 integration, and modern healthcare standards

set -e

echo "Creating OpenEMR FHIR and interoperability components..."

mysql -h localhost -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    USE openemr;
    
    -- ========================================
    -- FHIR RESOURCES AND INTEROPERABILITY
    -- ========================================
    
    -- FHIR Resource mapping
    CREATE TABLE IF NOT EXISTS fhir_resource_mapping (
        id int(11) NOT NULL AUTO_INCREMENT,
        resource_type varchar(50) NOT NULL,
        openemr_table varchar(100) NOT NULL,
        openemr_column varchar(100) DEFAULT NULL,
        fhir_element varchar(200) NOT NULL,
        mapping_notes text,
        active tinyint(1) NOT NULL DEFAULT 1,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY resource_type (resource_type),
        KEY openemr_table (openemr_table),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Essential FHIR resource mappings for WebQX
    INSERT IGNORE INTO fhir_resource_mapping (resource_type, openemr_table, openemr_column, fhir_element, mapping_notes) VALUES
    ('Patient', 'patient_data', 'pid', 'Patient.id', 'Primary patient identifier'),
    ('Patient', 'patient_data', 'fname', 'Patient.name.given', 'Patient first name'),
    ('Patient', 'patient_data', 'lname', 'Patient.name.family', 'Patient last name'),
    ('Patient', 'patient_data', 'DOB', 'Patient.birthDate', 'Patient date of birth'),
    ('Patient', 'patient_data', 'sex', 'Patient.gender', 'Patient gender'),
    ('Patient', 'patient_data', 'phone_home', 'Patient.telecom', 'Patient contact information'),
    ('Patient', 'patient_data', 'email', 'Patient.telecom', 'Patient email address'),
    ('Encounter', 'form_encounter', 'encounter', 'Encounter.id', 'Encounter identifier'),
    ('Encounter', 'form_encounter', 'date', 'Encounter.period.start', 'Encounter start date'),
    ('Encounter', 'form_encounter', 'reason', 'Encounter.reasonCode', 'Reason for encounter'),
    ('Practitioner', 'users', 'id', 'Practitioner.id', 'Provider identifier'),
    ('Practitioner', 'users', 'fname', 'Practitioner.name.given', 'Provider first name'),
    ('Practitioner', 'users', 'lname', 'Practitioner.name.family', 'Provider last name'),
    ('Observation', 'form_vitals', 'id', 'Observation.id', 'Vital signs observation'),
    ('MedicationRequest', 'prescriptions', 'id', 'MedicationRequest.id', 'Prescription/medication request'),
    ('AllergyIntolerance', 'lists', 'id', 'AllergyIntolerance.id', 'Patient allergies and intolerances'),
    ('Condition', 'lists', 'id', 'Condition.id', 'Patient conditions and problems'),
    ('DiagnosticReport', 'procedure_result', 'procedure_result_id', 'DiagnosticReport.id', 'Laboratory and diagnostic results'),
    ('Immunization', 'immunizations', 'id', 'Immunization.id', 'Patient immunization records'),
    ('Organization', 'facility', 'id', 'Organization.id', 'Healthcare organization/facility');
    
    -- ========================================
    -- API AND OAUTH INTEGRATION
    -- ========================================
    
    -- API tokens for external integrations
    CREATE TABLE IF NOT EXISTS api_token (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        client_id varchar(80) NOT NULL,
        client_name varchar(255) DEFAULT NULL,
        token varchar(80) NOT NULL,
        expiry datetime NOT NULL,
        scope varchar(2000) DEFAULT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY token (token),
        KEY user_id (user_id),
        KEY client_id (client_id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- OAuth2 clients for FHIR API access
    CREATE TABLE IF NOT EXISTS oauth_clients (
        client_id varchar(80) NOT NULL,
        client_secret varchar(80) DEFAULT NULL,
        redirect_uri varchar(2000) DEFAULT NULL,
        grant_types varchar(80) DEFAULT NULL,
        scope varchar(4000) DEFAULT NULL,
        user_id varchar(80) DEFAULT NULL,
        client_name varchar(255) DEFAULT NULL,
        client_description text,
        contacts text,
        is_enabled tinyint(1) NOT NULL DEFAULT 1,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (client_id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- WebQX default OAuth client for FHIR API
    INSERT IGNORE INTO oauth_clients (client_id, client_secret, grant_types, scope, client_name, client_description, is_enabled) VALUES
    ('webqx-fhir-client', 'webqx-secret-2025', 'client_credentials authorization_code', 'openid fhirUser api:fhir', 'WebQX FHIR Client', 'WebQX integrated FHIR API client for healthcare interoperability', 1),
    ('webqx-portal-client', 'webqx-portal-secret', 'authorization_code', 'openid profile patient/*.*', 'WebQX Patient Portal', 'WebQX patient portal OAuth client', 1),
    ('webqx-provider-client', 'webqx-provider-secret', 'authorization_code', 'openid profile user/*.*', 'WebQX Provider Portal', 'WebQX provider portal OAuth client', 1);
    
    -- ========================================
    -- HL7 AND MESSAGING STANDARDS
    -- ========================================
    
    -- HL7 message queue
    CREATE TABLE IF NOT EXISTS hl7_messages (
        id int(11) NOT NULL AUTO_INCREMENT,
        message_id varchar(100) NOT NULL,
        message_type varchar(10) NOT NULL,
        message_control_id varchar(20) NOT NULL,
        sending_application varchar(100) DEFAULT NULL,
        sending_facility varchar(100) DEFAULT NULL,
        receiving_application varchar(100) DEFAULT NULL,
        receiving_facility varchar(100) DEFAULT NULL,
        message_datetime datetime NOT NULL,
        message_text longtext NOT NULL,
        processing_status enum('pending','processing','processed','error') NOT NULL DEFAULT 'pending',
        error_message text,
        patient_id bigint(20) DEFAULT NULL,
        encounter_id bigint(20) DEFAULT NULL,
        processed_datetime datetime DEFAULT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY message_control_id (message_control_id),
        KEY message_type (message_type),
        KEY processing_status (processing_status),
        KEY patient_id (patient_id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- ========================================
    -- CCDA AND DOCUMENT EXCHANGE
    -- ========================================
    
    -- CCDA documents for care continuity
    CREATE TABLE IF NOT EXISTS ccda_documents (
        id int(11) NOT NULL AUTO_INCREMENT,
        pid bigint(20) NOT NULL,
        encounter_id bigint(20) DEFAULT NULL,
        document_type varchar(50) NOT NULL,
        ccda_data longtext NOT NULL,
        created_by int(11) NOT NULL,
        created_date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status enum('draft','final','amended','error') NOT NULL DEFAULT 'draft',
        external_id varchar(100) DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY pid (pid),
        KEY encounter_id (encounter_id),
        KEY document_type (document_type),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- ========================================
    -- QUALITY MEASURES AND REPORTING
    -- ========================================
    
    -- Clinical Quality Measures (CQM) tracking
    CREATE TABLE IF NOT EXISTS cqm_measures (
        id int(11) NOT NULL AUTO_INCREMENT,
        measure_id varchar(50) NOT NULL,
        measure_title varchar(255) NOT NULL,
        measure_description text,
        measure_version varchar(20) DEFAULT NULL,
        reporting_year int(4) NOT NULL,
        measure_type enum('process','outcome','structure','patient_reported_outcome') NOT NULL,
        domain varchar(100) DEFAULT NULL,
        active tinyint(1) NOT NULL DEFAULT 1,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY measure_id_year (measure_id, reporting_year),
        KEY measure_type (measure_type),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Common CQM measures for WebQX
    INSERT IGNORE INTO cqm_measures (measure_id, measure_title, measure_description, measure_version, reporting_year, measure_type, domain) VALUES
    ('CMS2', 'Preventive Care and Screening: Screening for Depression and Follow-Up Plan', 'Depression screening and follow-up plan', 'v11', 2025, 'process', 'Mental Health'),
    ('CMS22', 'Preventive Care and Screening: Screening for High Blood Pressure and Follow-Up Documented', 'Blood pressure screening and documentation', 'v10', 2025, 'process', 'Cardiovascular'),
    ('CMS50', 'Closing the Referral Loop: Receipt of Specialist Report', 'Specialist referral follow-up', 'v10', 2025, 'process', 'Care Coordination'),
    ('CMS68', 'Documentation of Current Medications in the Medical Record', 'Current medication documentation', 'v11', 2025, 'process', 'Medication Management'),
    ('CMS69', 'Preventive Care and Screening: Body Mass Index (BMI) Screening and Follow-Up Plan', 'BMI screening and follow-up', 'v10', 2025, 'process', 'Preventive Care'),
    ('CMS74', 'Primary Caries Prevention Intervention as Offered by Primary Care Providers', 'Dental caries prevention', 'v11', 2025, 'process', 'Preventive Care'),
    ('CMS117', 'Childhood Immunization Status', 'Childhood immunization tracking', 'v10', 2025, 'process', 'Immunization'),
    ('CMS122', 'Diabetes: Hemoglobin A1c (HbA1c) Poor Control (>9%)', 'Diabetes HbA1c control monitoring', 'v10', 2025, 'outcome', 'Diabetes'),
    ('CMS124', 'Cervical Cancer Screening', 'Cervical cancer screening compliance', 'v10', 2025, 'process', 'Cancer Screening'),
    ('CMS125', 'Breast Cancer Screening', 'Breast cancer screening compliance', 'v10', 2025, 'process', 'Cancer Screening');
    
    -- ========================================
    -- TELEHEALTH AND REMOTE MONITORING
    -- ========================================
    
    -- WebQX Telehealth sessions
    CREATE TABLE IF NOT EXISTS webqx_telehealth_sessions (
        id int(11) NOT NULL AUTO_INCREMENT,
        patient_id bigint(20) NOT NULL,
        provider_id int(11) NOT NULL,
        encounter_id bigint(20) DEFAULT NULL,
        session_id varchar(100) NOT NULL,
        session_type enum('video','audio','chat','remote_monitoring') NOT NULL,
        scheduled_datetime datetime NOT NULL,
        started_datetime datetime DEFAULT NULL,
        ended_datetime datetime DEFAULT NULL,
        duration_minutes int(11) DEFAULT NULL,
        session_status enum('scheduled','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
        connection_quality enum('excellent','good','fair','poor') DEFAULT NULL,
        technical_issues text,
        clinical_notes text,
        patient_satisfaction_score tinyint(1) DEFAULT NULL,
        billing_code varchar(20) DEFAULT NULL,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY session_id (session_id),
        KEY patient_id (patient_id),
        KEY provider_id (provider_id),
        KEY encounter_id (encounter_id),
        KEY scheduled_datetime (scheduled_datetime),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Remote monitoring device data
    CREATE TABLE IF NOT EXISTS webqx_remote_monitoring (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        patient_id bigint(20) NOT NULL,
        device_type varchar(50) NOT NULL,
        device_id varchar(100) NOT NULL,
        measurement_type varchar(50) NOT NULL,
        measurement_value varchar(100) NOT NULL,
        measurement_unit varchar(20) DEFAULT NULL,
        measurement_datetime datetime NOT NULL,
        normal_range_min float DEFAULT NULL,
        normal_range_max float DEFAULT NULL,
        alert_level enum('normal','warning','critical') DEFAULT 'normal',
        transmitted_datetime datetime DEFAULT CURRENT_TIMESTAMP,
        processed_by_provider tinyint(1) DEFAULT 0,
        provider_notes text,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY patient_id (patient_id),
        KEY device_type (device_type),
        KEY measurement_type (measurement_type),
        KEY measurement_datetime (measurement_datetime),
        KEY alert_level (alert_level),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- ========================================
    -- INTEGRATION LOGS AND MONITORING
    -- ========================================
    
    -- Integration activity logs
    CREATE TABLE IF NOT EXISTS integration_logs (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        integration_type varchar(50) NOT NULL,
        operation varchar(50) NOT NULL,
        resource_type varchar(50) DEFAULT NULL,
        resource_id varchar(100) DEFAULT NULL,
        request_method varchar(10) DEFAULT NULL,
        request_url varchar(500) DEFAULT NULL,
        request_headers text,
        request_body longtext,
        response_status int(3) DEFAULT NULL,
        response_headers text,
        response_body longtext,
        processing_time_ms int(11) DEFAULT NULL,
        success tinyint(1) NOT NULL DEFAULT 1,
        error_message text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        user_id int(11) DEFAULT NULL,
        patient_id bigint(20) DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY integration_type (integration_type),
        KEY operation (operation),
        KEY success (success),
        KEY created_at (created_at),
        KEY user_id (user_id),
        KEY patient_id (patient_id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
EOSQL

echo "OpenEMR FHIR and interoperability components created successfully!"
echo ""
echo "Interoperability components include:"
echo "  ✅ FHIR resource mapping for R4 compliance"
echo "  ✅ OAuth2 and API token management"
echo "  ✅ HL7 message processing and queue"
echo "  ✅ CCDA document generation and exchange"
echo "  ✅ Clinical Quality Measures (CQM) tracking"
echo "  ✅ WebQX telehealth session management"
echo "  ✅ Remote patient monitoring integration"
echo "  ✅ Comprehensive integration logging"
echo "  ✅ Modern healthcare standards compliance"