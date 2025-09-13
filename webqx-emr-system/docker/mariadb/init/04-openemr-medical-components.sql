#!/bin/bash
# OpenEMR Essential Medical Components
# Medical coding, procedures, and clinical data structures

set -e

echo "Creating OpenEMR medical components and coding systems..."

mysql -h localhost -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    USE openemr;
    
    -- ========================================
    -- MEDICAL CODING SYSTEMS
    -- ========================================
    
    -- ICD10 diagnosis codes
    CREATE TABLE IF NOT EXISTS icd10_dx_order_code (
        dx_id int(11) NOT NULL,
        dx_code varchar(7) NOT NULL,
        formatted_dx_code varchar(10) NOT NULL,
        valid_for_coding char(1) NOT NULL,
        short_desc varchar(60) NOT NULL,
        long_desc varchar(300) DEFAULT NULL,
        active tinyint(1) NOT NULL DEFAULT 1,
        revision int(4) NOT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (dx_id),
        KEY dx_code (dx_code),
        KEY formatted_dx_code (formatted_dx_code),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Common ICD10 codes for basic EMR functionality
    INSERT IGNORE INTO icd10_dx_order_code (dx_id, dx_code, formatted_dx_code, valid_for_coding, short_desc, long_desc, revision) VALUES
    (1, 'Z000', 'Z00.0', 'Y', 'General adult medical examination', 'Encounter for general adult medical examination without abnormal findings', 2025),
    (2, 'Z0000', 'Z00.00', 'Y', 'General adult medical exam w/o abnormal findings', 'Encounter for general adult medical examination without abnormal findings', 2025),
    (3, 'Z0001', 'Z00.01', 'Y', 'General adult medical exam w/ abnormal findings', 'Encounter for general adult medical examination with abnormal findings', 2025),
    (4, 'I10', 'I10', 'Y', 'Essential hypertension', 'Essential (primary) hypertension', 2025),
    (5, 'E119', 'E11.9', 'Y', 'Type 2 diabetes without complications', 'Type 2 diabetes mellitus without complications', 2025),
    (6, 'Z125', 'Z12.5', 'Y', 'Encounter for screening for malignant neoplasm of prostate', 'Encounter for screening for malignant neoplasm of prostate', 2025),
    (7, 'Z1231', 'Z12.31', 'Y', 'Encounter for screening mammography for malignant neoplasm of breast', 'Encounter for screening mammography for malignant neoplasm of breast', 2025),
    (8, 'Z23', 'Z23', 'Y', 'Encounter for immunization', 'Encounter for immunization', 2025),
    (9, 'Z51', 'Z51', 'Y', 'Encounter for other aftercare', 'Encounter for other aftercare and medical care', 2025),
    (10, 'M545', 'M54.5', 'Y', 'Low back pain', 'Low back pain', 2025);
    
    -- CPT procedure codes
    CREATE TABLE IF NOT EXISTS procedure_type (
        procedure_type_id bigint(20) NOT NULL AUTO_INCREMENT,
        parent bigint(20) NOT NULL DEFAULT 1,
        name varchar(63) NOT NULL DEFAULT '',
        lab_id int(11) NOT NULL DEFAULT 0,
        procedure_code varchar(31) NOT NULL DEFAULT '',
        procedure_type varchar(31) NOT NULL DEFAULT '',
        body_site varchar(31) NOT NULL DEFAULT '',
        specimen varchar(31) NOT NULL DEFAULT '',
        route_admin varchar(31) NOT NULL DEFAULT '',
        laterality varchar(31) NOT NULL DEFAULT '',
        description varchar(255) DEFAULT NULL,
        standard_code varchar(255) DEFAULT NULL,
        notes text,
        active tinyint(1) NOT NULL DEFAULT 1,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (procedure_type_id),
        KEY parent (parent),
        KEY procedure_code (procedure_code),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Common procedure types
    INSERT IGNORE INTO procedure_type (procedure_type_id, name, procedure_code, procedure_type, description, standard_code) VALUES
    (1, 'Procedure Types', '', 'group', 'Procedure type categories', ''),
    (2, 'Office Visit - New Patient', '99201', 'eval_mgmt', 'Office visit for evaluation and management of new patient', 'CPT4'),
    (3, 'Office Visit - Established Patient', '99211', 'eval_mgmt', 'Office visit for evaluation and management of established patient', 'CPT4'),
    (4, 'Annual Physical Exam', '99397', 'preventive', 'Periodic comprehensive preventive medicine reevaluation', 'CPT4'),
    (5, 'Immunization Administration', '90471', 'immunization', 'Immunization administration (includes percutaneous, intradermal, subcutaneous, or intramuscular injections)', 'CPT4'),
    (6, 'Influenza Vaccine', '90658', 'immunization', 'Influenza virus vaccine, trivalent, split virus', 'CPT4'),
    (7, 'Blood Pressure Check', '99000', 'vital_signs', 'Blood pressure monitoring', 'CPT4'),
    (8, 'WebQX Telehealth Consult', '99421', 'telehealth', 'Online digital evaluation and management service', 'CPT4'),
    (9, 'WebQX Remote Monitoring', '99453', 'remote_monitoring', 'Remote patient monitoring setup', 'CPT4'),
    (10, 'Laboratory Test - Basic Metabolic Panel', '80048', 'laboratory', 'Basic metabolic panel (Calcium, total)', 'CPT4');
    
    -- ========================================
    -- VITAL SIGNS AND MEASUREMENTS
    -- ========================================
    
    -- Form vitals for storing vital signs
    CREATE TABLE IF NOT EXISTS form_vitals (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        date datetime DEFAULT NULL,
        pid bigint(20) NOT NULL DEFAULT 0,
        user varchar(255) DEFAULT NULL,
        groupname varchar(255) DEFAULT NULL,
        authorized tinyint(4) NOT NULL DEFAULT 0,
        activity tinyint(4) NOT NULL DEFAULT 0,
        bps int(11) DEFAULT 0,
        bpd int(11) DEFAULT 0,
        weight float(5,2) DEFAULT 0.00,
        height float(5,2) DEFAULT 0.00,
        bmi float(4,1) DEFAULT 0.0,
        bmi_status varchar(255) DEFAULT NULL,
        pulse int(11) DEFAULT 0,
        respiration int(11) DEFAULT 0,
        temperature float(5,2) DEFAULT 0.00,
        temp_method varchar(255) DEFAULT NULL,
        oxygen_saturation float(5,2) DEFAULT 0.00,
        head_circ float(4,2) DEFAULT 0.00,
        waist_circ float(5,2) DEFAULT 0.00,
        inhaled_oxygen_concentration float(5,2) DEFAULT 0.00,
        external_id varchar(20) DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY pid (pid),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- ========================================
    -- LABORATORY AND DIAGNOSTICS
    -- ========================================
    
    -- Procedure orders
    CREATE TABLE IF NOT EXISTS procedure_order (
        procedure_order_id bigint(20) NOT NULL AUTO_INCREMENT,
        provider_id int(11) NOT NULL DEFAULT 0 COMMENT 'see users table',
        patient_id bigint(20) NOT NULL DEFAULT 0 COMMENT 'see patient_data table',
        encounter_id bigint(20) NOT NULL DEFAULT 0 COMMENT 'see form_encounter table',
        date_collected datetime DEFAULT NULL COMMENT 'time specimen collected',
        date_ordered datetime DEFAULT NULL,
        order_priority varchar(31) DEFAULT NULL,
        order_status varchar(31) DEFAULT NULL COMMENT 'pending,routed,complete,canceled',
        patient_instructions text,
        activity tinyint(1) NOT NULL DEFAULT 1 COMMENT '0 if deleted',
        control_id bigint(20) NOT NULL DEFAULT 0 COMMENT 'This is the CONTROL ID that is sent back from lab',
        lab_id int(11) NOT NULL DEFAULT 0 COMMENT 'see procedure_providers table',
        specimen_type varchar(31) DEFAULT NULL COMMENT 'from the proc_type table',
        specimen_location varchar(31) DEFAULT NULL COMMENT 'from proc_type table',
        specimen_volume varchar(31) DEFAULT NULL COMMENT 'from proc_type table',
        date_report datetime DEFAULT NULL COMMENT 'date the report is finalized',
        date_transmitted datetime DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (procedure_order_id),
        KEY patient_id (patient_id),
        KEY encounter_id (encounter_id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Procedure results
    CREATE TABLE IF NOT EXISTS procedure_result (
        procedure_result_id bigint(20) NOT NULL AUTO_INCREMENT,
        procedure_order_id bigint(20) NOT NULL DEFAULT 0,
        procedure_order_seq int(11) NOT NULL DEFAULT 0 COMMENT 'sequence number of this result in the order',
        procedure_type_id bigint(20) NOT NULL DEFAULT 0 COMMENT 'see procedure_type table',
        procedure_code varchar(31) DEFAULT NULL COMMENT 'depends on procedure_type',
        procedure_name text COMMENT 'descriptive name of the procedure code',
        procedure_source varchar(31) NOT NULL DEFAULT '' COMMENT '1=original order, 2=added after order sent',
        lab_id int(11) NOT NULL DEFAULT 0 COMMENT 'see procedure_providers table',
        result varchar(255) DEFAULT NULL COMMENT 'result value',
        result_data text COMMENT 'detailed result data',
        result_status varchar(31) NOT NULL DEFAULT '' COMMENT 'order status (pending,complete,etc)',
        result_datetime datetime DEFAULT NULL,
        result_abnormal varchar(31) NOT NULL DEFAULT '' COMMENT 'no,yes,high,low',
        abnormal_flag varchar(31) DEFAULT NULL,
        reult_lo_ref_range varchar(255) DEFAULT NULL,
        result_hi_ref_range varchar(255) DEFAULT NULL,
        result_units varchar(31) DEFAULT NULL,
        comments text,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (procedure_result_id),
        KEY procedure_order_id (procedure_order_id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- ========================================
    -- PHARMACY AND DRUG INFORMATION
    -- ========================================
    
    -- Drug dictionary
    CREATE TABLE IF NOT EXISTS drugs (
        drug_id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL DEFAULT '',
        ndc_number varchar(20) DEFAULT '',
        on_order tinyint(1) NOT NULL DEFAULT 0,
        reorder_point float DEFAULT NULL,
        max_level float DEFAULT NULL,
        last_notify date NOT NULL DEFAULT '1900-01-01',
        reactions text,
        form int(11) DEFAULT NULL,
        size float DEFAULT NULL,
        unit int(11) DEFAULT NULL,
        route int(11) DEFAULT NULL,
        substitute int(11) DEFAULT NULL,
        related_code varchar(255) DEFAULT '',
        cyp_factor float DEFAULT 0,
        active tinyint(1) NOT NULL DEFAULT 1,
        allow_combining tinyint(1) NOT NULL DEFAULT 0,
        allow_substitution tinyint(1) NOT NULL DEFAULT 1,
        drug_code varchar(25) DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (drug_id),
        KEY name (name),
        KEY ndc_number (ndc_number),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Common medications
    INSERT IGNORE INTO drugs (drug_id, name, ndc_number, form, active, drug_code) VALUES
    (1, 'Acetaminophen 325mg', '00113-0101-78', 1, 1, 'ACET325'),
    (2, 'Ibuprofen 200mg', '00113-0199-78', 1, 1, 'IBU200'),
    (3, 'Lisinopril 10mg', '00113-0234-90', 1, 1, 'LIS10'),
    (4, 'Metformin 500mg', '00113-0345-90', 1, 1, 'MET500'),
    (5, 'Amlodipine 5mg', '00113-0456-30', 1, 1, 'AML5'),
    (6, 'Atorvastatin 20mg', '00113-0567-30', 1, 1, 'ATOR20'),
    (7, 'Omeprazole 20mg', '00113-0678-30', 1, 1, 'OME20'),
    (8, 'Levothyroxine 50mcg', '00113-0789-30', 1, 1, 'LEV50'),
    (9, 'Hydrochlorothiazide 25mg', '00113-0890-30', 1, 1, 'HCTZ25'),
    (10, 'Prednisone 5mg', '00113-0901-21', 1, 1, 'PRED5');
    
    -- ========================================
    -- IMMUNIZATION TRACKING
    -- ========================================
    
    -- Immunizations
    CREATE TABLE IF NOT EXISTS immunizations (
        id int(11) NOT NULL AUTO_INCREMENT,
        patient_id int(11) DEFAULT NULL,
        administered_date date DEFAULT NULL,
        immunization_id int(11) DEFAULT NULL,
        cvx_code varchar(10) DEFAULT NULL,
        manufacturer varchar(100) DEFAULT NULL,
        lot_number varchar(50) DEFAULT NULL,
        administered_by_id bigint(20) DEFAULT NULL,
        administered_by varchar(255) DEFAULT NULL,
        education_date date DEFAULT NULL,
        vis_date date DEFAULT NULL,
        note text,
        create_date datetime DEFAULT CURRENT_TIMESTAMP,
        update_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by bigint(20) DEFAULT NULL,
        updated_by bigint(20) DEFAULT NULL,
        amount_administered float DEFAULT NULL,
        amount_administered_unit varchar(50) DEFAULT NULL,
        expiration_date date DEFAULT NULL,
        route varchar(100) DEFAULT NULL,
        administration_site varchar(100) DEFAULT NULL,
        added_erroneously tinyint(1) NOT NULL DEFAULT 0,
        external_id varchar(20) DEFAULT NULL,
        completion_status varchar(50) DEFAULT NULL,
        information_source varchar(31) DEFAULT NULL,
        refusal_reason varchar(31) DEFAULT NULL,
        ordering_provider bigint(20) DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY patient_id (patient_id),
        KEY administered_by_id (administered_by_id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- ========================================
    -- ACCESS CONTROL AND SECURITY
    -- ========================================
    
    -- ACL (Access Control List) groups
    CREATE TABLE IF NOT EXISTS gacl_aro_groups (
        id int(11) NOT NULL AUTO_INCREMENT,
        parent_id int(11) NOT NULL DEFAULT 0,
        lft int(11) NOT NULL DEFAULT 0,
        rght int(11) NOT NULL DEFAULT 0,
        name varchar(255) NOT NULL DEFAULT '',
        value varchar(255) NOT NULL DEFAULT '',
        PRIMARY KEY (id),
        KEY gacl_value (value),
        KEY gacl_parent_id (parent_id),
        KEY gacl_lft_rght (lft, rght)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Default ACL groups for WebQX
    INSERT IGNORE INTO gacl_aro_groups (id, parent_id, lft, rght, name, value) VALUES
    (1, 0, 1, 22, 'OpenEMR', 'openemr'),
    (2, 1, 2, 7, 'Administrators', 'admin'),
    (3, 2, 3, 4, 'Super Administrator', 'superadmin'),
    (4, 2, 5, 6, 'Administrator', 'administrator'),
    (5, 1, 8, 13, 'Physicians', 'physicians'),
    (6, 5, 9, 10, 'Doctor', 'doctor'),
    (7, 5, 11, 12, 'Clinician', 'clinician'),
    (8, 1, 14, 17, 'Staff', 'staff'),
    (9, 8, 15, 16, 'Nurse', 'nurse'),
    (10, 1, 18, 21, 'WebQX Users', 'webqx'),
    (11, 10, 19, 20, 'WebQX Patient', 'webqx_patient');
    
    -- ========================================
    -- MESSAGING AND COMMUNICATION
    -- ========================================
    
    -- Patient portal messages
    CREATE TABLE IF NOT EXISTS pnotes (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        date datetime DEFAULT NULL,
        body longtext,
        pid bigint(20) NOT NULL DEFAULT 0,
        user varchar(255) NOT NULL DEFAULT '',
        groupname varchar(255) NOT NULL DEFAULT '',
        authorized tinyint(4) NOT NULL DEFAULT 0,
        activity tinyint(4) NOT NULL DEFAULT 0,
        title varchar(255) NOT NULL DEFAULT '',
        assigned_to varchar(255) NOT NULL DEFAULT '',
        deleted tinyint(4) NOT NULL DEFAULT 0,
        message_status varchar(20) NOT NULL DEFAULT 'New',
        portal_relation varchar(30) NOT NULL DEFAULT '',
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY pid (pid),
        KEY assigned_to (assigned_to),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- ========================================
    -- REPORTING AND ANALYTICS
    -- ========================================
    
    -- Report results for clinical quality measures
    CREATE TABLE IF NOT EXISTS report_results (
        report_id bigint(20) NOT NULL AUTO_INCREMENT,
        date_report datetime DEFAULT NULL,
        date_report_end datetime DEFAULT NULL,
        type varchar(31) DEFAULT NULL,
        provider_id int(11) DEFAULT NULL,
        patient_id bigint(20) DEFAULT NULL,
        rule_id varchar(31) NOT NULL DEFAULT '',
        numerator_label varchar(63) NOT NULL DEFAULT '',
        numerator_pass_filter varchar(255) NOT NULL DEFAULT '',
        numerator_pass_target varchar(255) NOT NULL DEFAULT '',
        percentage int(11) DEFAULT NULL,
        pass_filter int(11) DEFAULT NULL,
        pass_target int(11) DEFAULT NULL,
        total_patients int(11) DEFAULT NULL,
        excluded int(11) DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (report_id),
        KEY patient_id (patient_id),
        KEY provider_id (provider_id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
EOSQL

echo "OpenEMR medical components created successfully!"
echo ""
echo "Medical components include:"
echo "  ✅ ICD-10 diagnosis coding system"
echo "  ✅ CPT procedure codes and types"
echo "  ✅ Vital signs and measurements tracking"
echo "  ✅ Laboratory orders and results management"
echo "  ✅ Comprehensive drug dictionary and pharmacy"
echo "  ✅ Immunization tracking system"
echo "  ✅ Access control and security (ACL)"
echo "  ✅ Patient messaging and communication"
echo "  ✅ Clinical reporting and analytics"
echo "  ✅ WebQX telehealth integration codes"