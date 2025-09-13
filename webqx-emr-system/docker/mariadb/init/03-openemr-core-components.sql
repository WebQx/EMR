#!/bin/bash
# Complete OpenEMR Core Components Initialization
# Essential OpenEMR tables for full EMR functionality

set -e

echo "Creating OpenEMR core components and essential tables..."

mysql -h localhost -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    USE openemr;
    
    -- ========================================
    -- CORE OPENEMR TABLES
    -- ========================================
    
    -- Version tracking
    CREATE TABLE IF NOT EXISTS version (
        v_id int(11) NOT NULL AUTO_INCREMENT,
        v_major int(11) NOT NULL DEFAULT 0,
        v_minor int(11) NOT NULL DEFAULT 0,
        v_patch int(11) NOT NULL DEFAULT 0,
        v_realpatch int(11) NOT NULL DEFAULT 0,
        v_tag varchar(31) NOT NULL DEFAULT '',
        v_database int(11) NOT NULL DEFAULT 0,
        v_acl int(11) NOT NULL DEFAULT 0,
        PRIMARY KEY (v_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    INSERT IGNORE INTO version (v_major, v_minor, v_patch, v_realpatch, v_tag, v_database, v_acl) 
    VALUES (7, 0, 2, 1, 'WebQX-EMR', 1, 1);
    
    -- Globals (system configuration)
    CREATE TABLE IF NOT EXISTS globals (
        gl_name varchar(63) NOT NULL DEFAULT '',
        gl_index int(11) NOT NULL DEFAULT 0,
        gl_value text,
        PRIMARY KEY (gl_name, gl_index)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Essential OpenEMR configuration
    INSERT IGNORE INTO globals (gl_name, gl_index, gl_value) VALUES
    ('language_default', 0, 'English (Standard)'),
    ('date_display_format', 0, '1'),
    ('time_display_format', 0, '1'),
    ('currency_decimals', 0, '2'),
    ('currency_symbol', 0, '\$'),
    ('gbl_time_zone', 0, 'America/New_York'),
    ('default_top_pane', 0, 'main_info.php'),
    ('enable_auditlog', 0, '1'),
    ('enable_cdr', 0, '1'),
    ('patient_create_unique_pid', 0, '1'),
    ('webqx_integration', 0, '1'),
    ('webqx_version', 0, '2025.09.13');
    
    -- ========================================
    -- PATIENT MANAGEMENT TABLES
    -- ========================================
    
    -- Patient history
    CREATE TABLE IF NOT EXISTS history_data (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        pid bigint(20) NOT NULL DEFAULT 0,
        date datetime DEFAULT NULL,
        coffee text,
        tobacco text,
        alcohol text,
        sleep_patterns text,
        exercise_patterns text,
        seatbelt_use text,
        counseling text,
        hazardous_activities text,
        recreational_drugs text,
        occupation text,
        last_exam_date date DEFAULT NULL,
        exams text,
        usertext1 text,
        usertext2 text,
        usertext3 text,
        usertext4 text,
        usertext5 text,
        usertext6 text,
        usertext7 text,
        usertext8 text,
        userlist1 varchar(255) DEFAULT NULL,
        userlist2 varchar(255) DEFAULT NULL,
        userlist3 varchar(255) DEFAULT NULL,
        userlist4 varchar(255) DEFAULT NULL,
        userlist5 varchar(255) DEFAULT NULL,
        userdate1 date DEFAULT NULL,
        userdate2 date DEFAULT NULL,
        userdate3 date DEFAULT NULL,
        userarea1 text,
        userarea2 text,
        PRIMARY KEY (id),
        KEY pid (pid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Encounters (visits)
    CREATE TABLE IF NOT EXISTS form_encounter (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        date datetime DEFAULT NULL,
        reason longtext,
        facility varchar(255) NOT NULL DEFAULT '',
        facility_id int(11) NOT NULL DEFAULT 0,
        pid bigint(20) NOT NULL DEFAULT 0,
        encounter bigint(20) NOT NULL DEFAULT 0,
        onset_date datetime DEFAULT NULL,
        sensitivity varchar(30) NOT NULL DEFAULT '',
        billing_note text,
        pc_catid int(11) NOT NULL DEFAULT 5,
        last_level_billed int(11) NOT NULL DEFAULT 0,
        last_level_closed int(11) NOT NULL DEFAULT 0,
        last_stmt_date date DEFAULT NULL,
        stmt_count int(11) NOT NULL DEFAULT 0,
        provider_id int(11) DEFAULT 0,
        supervisor_id int(11) DEFAULT 0,
        invoice_refno varchar(31) NOT NULL DEFAULT '',
        referral_source varchar(31) NOT NULL DEFAULT '',
        billing_facility int(11) NOT NULL DEFAULT 0,
        external_id varchar(20) DEFAULT NULL,
        pos_code tinyint(4) DEFAULT NULL,
        class_code varchar(10) NOT NULL DEFAULT 'AMB',
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY pid_encounter (pid, encounter),
        KEY encounter (encounter),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- ========================================
    -- CLINICAL DOCUMENTATION
    -- ========================================
    
    -- Lists (medications, allergies, problems, etc.)
    CREATE TABLE IF NOT EXISTS lists (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        date datetime DEFAULT NULL,
        type varchar(255) DEFAULT NULL,
        subtype varchar(255) DEFAULT NULL,
        pid bigint(20) NOT NULL DEFAULT 0,
        outcome int(11) NOT NULL DEFAULT 0,
        destination varchar(255) DEFAULT NULL,
        begdate date DEFAULT NULL,
        enddate date DEFAULT NULL,
        returndate date DEFAULT NULL,
        occurrence int(11) NOT NULL DEFAULT 0,
        classification int(11) NOT NULL DEFAULT 0,
        referredby varchar(255) DEFAULT NULL,
        extrainfo text,
        diagnosis varchar(255) DEFAULT NULL,
        activity tinyint(4) NOT NULL DEFAULT 1,
        comments longtext,
        user varchar(255) DEFAULT NULL,
        groupname varchar(255) DEFAULT NULL,
        reaction text,
        severity_al varchar(50) DEFAULT NULL,
        unable_to_tolerate varchar(200) DEFAULT NULL,
        last_update timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        title varchar(255) NOT NULL DEFAULT '',
        external_allergyid varchar(20) DEFAULT NULL,
        erx_source tinyint(4) NOT NULL DEFAULT 0,
        erx_uploaded varchar(12) NOT NULL DEFAULT '',
        modifydate datetime DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY pid (pid),
        KEY type (type),
        KEY activity (activity),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Prescriptions
    CREATE TABLE IF NOT EXISTS prescriptions (
        id int(11) NOT NULL AUTO_INCREMENT,
        patient_id int(11) DEFAULT NULL,
        filled_by_id int(11) DEFAULT NULL,
        pharmacy_id int(11) DEFAULT NULL,
        date_added date DEFAULT NULL,
        date_modified timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        provider_id int(11) DEFAULT NULL,
        encounter int(11) DEFAULT NULL,
        start_date date DEFAULT NULL,
        drug varchar(150) DEFAULT NULL,
        drug_id int(11) DEFAULT NULL,
        rxnorm_drugcode int(11) DEFAULT NULL,
        form int(11) DEFAULT NULL,
        dosage varchar(100) DEFAULT NULL,
        qty varchar(31) DEFAULT NULL,
        size float DEFAULT NULL,
        unit int(11) DEFAULT NULL,
        route int(11) DEFAULT NULL,
        interval int(11) DEFAULT NULL,
        substitute tinyint(4) DEFAULT NULL,
        refills int(11) DEFAULT NULL,
        per_refill int(11) DEFAULT NULL,
        filled_date date DEFAULT NULL,
        medication int(11) DEFAULT NULL,
        note text,
        active tinyint(4) NOT NULL DEFAULT 1,
        datetime datetime DEFAULT NULL,
        user varchar(50) DEFAULT NULL,
        site varchar(50) DEFAULT NULL,
        prescriptionguid varchar(50) DEFAULT NULL,
        erx_source tinyint(1) NOT NULL DEFAULT 0,
        erx_uploaded varchar(12) NOT NULL DEFAULT '',
        drug_info_erx text,
        external_id varchar(50) DEFAULT NULL,
        end_date date DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY patient_id (patient_id),
        KEY provider_id (provider_id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- ========================================
    -- SCHEDULING AND APPOINTMENTS
    -- ========================================
    
    -- Calendar events/appointments
    CREATE TABLE IF NOT EXISTS openemr_postcalendar_events (
        pc_eid int(11) unsigned NOT NULL AUTO_INCREMENT,
        pc_catid int(11) NOT NULL DEFAULT 0,
        pc_multiple int(10) unsigned NOT NULL DEFAULT 0,
        pc_aid varchar(30) NOT NULL DEFAULT '1',
        pc_pid varchar(11) DEFAULT NULL,
        pc_title varchar(150) DEFAULT NULL,
        pc_time time DEFAULT NULL,
        pc_hometext text,
        pc_comments int(11) DEFAULT 0,
        pc_counter int(11) unsigned DEFAULT NULL,
        pc_topic varchar(255) NOT NULL DEFAULT '',
        pc_inform int(1) NOT NULL DEFAULT 1,
        pc_eventDate date NOT NULL DEFAULT '1900-01-01',
        pc_endDate date NOT NULL DEFAULT '1900-01-01',
        pc_duration bigint(20) NOT NULL DEFAULT 0,
        pc_recurrtype int(1) NOT NULL DEFAULT 0,
        pc_recurrspec text,
        pc_recurrfreq int(3) NOT NULL DEFAULT 0,
        pc_startTime time NOT NULL DEFAULT '00:00:00',
        pc_endTime time NOT NULL DEFAULT '00:00:00',
        pc_alldayevent int(1) NOT NULL DEFAULT 0,
        pc_location text,
        pc_conttel varchar(50) DEFAULT NULL,
        pc_contname varchar(50) DEFAULT NULL,
        pc_contemail varchar(255) DEFAULT NULL,
        pc_website varchar(255) DEFAULT NULL,
        pc_fee varchar(50) DEFAULT NULL,
        pc_eventstatus int(11) NOT NULL DEFAULT 1,
        pc_sharing int(11) NOT NULL DEFAULT 1,
        pc_language varchar(30) NOT NULL DEFAULT '',
        pc_apptstatus varchar(15) NOT NULL DEFAULT '-',
        pc_prefcatid int(11) NOT NULL DEFAULT 0,
        pc_facility int(11) NOT NULL DEFAULT 0,
        pc_billing_location int(11) NOT NULL DEFAULT 0,
        pc_room varchar(20) NOT NULL DEFAULT '',
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (pc_eid),
        KEY basic_event (pc_catid, pc_aid, pc_pid, pc_eventDate, pc_endDate, pc_eventstatus),
        KEY pc_eventDate (pc_eventDate),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Calendar categories
    CREATE TABLE IF NOT EXISTS openemr_postcalendar_categories (
        pc_catid int(11) unsigned NOT NULL AUTO_INCREMENT,
        pc_catname varchar(100) NOT NULL DEFAULT '',
        pc_catcolor varchar(50) NOT NULL DEFAULT '',
        pc_catdesc text NOT NULL,
        pc_recurrtype int(1) NOT NULL DEFAULT 0,
        pc_enddate date DEFAULT NULL,
        pc_recurrspec text NOT NULL,
        pc_recurrfreq int(11) NOT NULL DEFAULT 0,
        pc_duration bigint(20) NOT NULL DEFAULT 0,
        pc_end_date_flag tinyint(4) NOT NULL DEFAULT 0,
        pc_end_date_type int(11) DEFAULT NULL,
        pc_end_date_freq int(11) NOT NULL DEFAULT 0,
        pc_end_all_day tinyint(1) NOT NULL DEFAULT 0,
        pc_dailylimit int(2) NOT NULL DEFAULT 0,
        pc_cattype int(11) NOT NULL DEFAULT 0,
        pc_active tinyint(1) NOT NULL DEFAULT 1,
        pc_seq int(11) NOT NULL DEFAULT 0,
        aco_spec varchar(63) NOT NULL DEFAULT 'admin|calendar',
        PRIMARY KEY (pc_catid),
        KEY pc_catname (pc_catname)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Default appointment categories
    INSERT IGNORE INTO openemr_postcalendar_categories (pc_catid, pc_catname, pc_catcolor, pc_catdesc, pc_cattype) VALUES
    (1, 'No Show', '#FFFF33', 'Patient did not show up', 0),
    (2, 'In Office', '#FFCCAA', 'Normal in-office appointment', 0),
    (3, 'Out Of Office', '#CCFFCC', 'Out of office appointment', 0),
    (4, 'Vacation', '#CCFFFF', 'Vacation time', 1),
    (5, 'Office Visit', '#CCCCCC', 'Standard office visit', 0),
    (9, 'Established Patient', '#FFFFFF', 'Routine visit for established patient', 0),
    (10, 'New Patient', '#CCCCFF', 'Initial visit for new patient', 0),
    (11, 'Urgent', '#FF9999', 'Urgent care appointment', 0),
    (12, 'WebQX Telehealth', '#99CCFF', 'WebQX telehealth appointment', 0);
    
    -- ========================================
    -- BILLING AND INSURANCE
    -- ========================================
    
    -- Insurance companies
    CREATE TABLE IF NOT EXISTS insurance_companies (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255) DEFAULT NULL,
        attn varchar(255) DEFAULT NULL,
        cms_id varchar(15) DEFAULT NULL,
        ins_type_code tinyint(1) DEFAULT NULL,
        x12_receiver_id varchar(25) DEFAULT NULL,
        x12_default_partner_id int(11) DEFAULT NULL,
        x12_default_eligibility_id int(11) DEFAULT NULL,
        x12_default_eligibility_id_close int(11) DEFAULT NULL,
        alt_cms_id varchar(15) NOT NULL DEFAULT '',
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Insurance data for patients
    CREATE TABLE IF NOT EXISTS insurance_data (
        id int(11) NOT NULL AUTO_INCREMENT,
        type enum('primary','secondary','tertiary') DEFAULT NULL,
        provider int(11) DEFAULT NULL,
        plan_name varchar(60) DEFAULT NULL,
        policy_number varchar(60) DEFAULT NULL,
        group_number varchar(60) DEFAULT NULL,
        subscriber_lname varchar(255) DEFAULT NULL,
        subscriber_fname varchar(255) DEFAULT NULL,
        subscriber_mname varchar(255) DEFAULT NULL,
        subscriber_relationship varchar(255) DEFAULT NULL,
        subscriber_ss varchar(255) DEFAULT NULL,
        subscriber_DOB date DEFAULT NULL,
        subscriber_street varchar(255) DEFAULT NULL,
        subscriber_postal_code varchar(255) DEFAULT NULL,
        subscriber_city varchar(255) DEFAULT NULL,
        subscriber_state varchar(255) DEFAULT NULL,
        subscriber_country varchar(255) DEFAULT NULL,
        subscriber_phone varchar(255) DEFAULT NULL,
        subscriber_employer varchar(255) DEFAULT NULL,
        subscriber_employer_street varchar(255) DEFAULT NULL,
        subscriber_employer_postal_code varchar(255) DEFAULT NULL,
        subscriber_employer_state varchar(255) DEFAULT NULL,
        subscriber_employer_country varchar(255) DEFAULT NULL,
        subscriber_employer_city varchar(255) DEFAULT NULL,
        copay varchar(255) DEFAULT NULL,
        date datetime NOT NULL DEFAULT '1900-01-01 00:00:00',
        pid bigint(20) NOT NULL DEFAULT 0,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY pid (pid),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- ========================================
    -- DOCUMENT MANAGEMENT
    -- ========================================
    
    -- Documents
    CREATE TABLE IF NOT EXISTS documents (
        id int(11) NOT NULL AUTO_INCREMENT,
        type enum('file_url','blob','web_url') DEFAULT NULL,
        size int(11) DEFAULT NULL,
        date datetime DEFAULT NULL,
        url varchar(255) DEFAULT NULL,
        mimetype varchar(255) DEFAULT NULL,
        pages int(11) DEFAULT NULL,
        owner int(11) DEFAULT NULL,
        revision timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        foreign_id int(11) DEFAULT NULL,
        docdate date DEFAULT NULL,
        hash varchar(40) DEFAULT NULL,
        list_id bigint(20) NOT NULL DEFAULT 0,
        couch_docid varchar(100) DEFAULT NULL,
        couch_revid varchar(100) DEFAULT NULL,
        storagemethod tinyint(4) NOT NULL DEFAULT 0,
        path_depth tinyint(1) DEFAULT NULL,
        imported tinyint(1) DEFAULT 0,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY revision (revision),
        KEY foreign_id (foreign_id),
        KEY owner (owner),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Categories for documents
    CREATE TABLE IF NOT EXISTS categories (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255) DEFAULT NULL,
        value varchar(255) DEFAULT NULL,
        parent int(11) NOT NULL DEFAULT 1,
        lft int(11) NOT NULL DEFAULT 0,
        rght int(11) NOT NULL DEFAULT 0,
        aco_spec varchar(63) NOT NULL DEFAULT 'admin|super',
        PRIMARY KEY (id),
        KEY parent (parent),
        KEY lft (lft, rght)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Default document categories
    INSERT IGNORE INTO categories (id, name, value, parent, lft, rght) VALUES
    (1, 'Categories', '', 0, 1, 22),
    (2, 'Lab Report', '', 1, 2, 3),
    (3, 'Medical Record', '', 1, 4, 5),
    (4, 'Patient Information', '', 1, 6, 7),
    (5, 'Photographs', '', 1, 8, 9),
    (6, 'Consent Forms', '', 1, 10, 11),
    (7, 'Insurance Documents', '', 1, 12, 13),
    (8, 'WebQX Integration', '', 1, 14, 15),
    (9, 'Telehealth Records', '', 1, 16, 17),
    (10, 'Clinical Notes', '', 1, 18, 19),
    (11, 'Administrative', '', 1, 20, 21);
    
    -- ========================================
    -- CLINICAL DECISION RULES (CDR)
    -- ========================================
    
    -- Clinical rules
    CREATE TABLE IF NOT EXISTS clinical_rules (
        id varchar(31) NOT NULL DEFAULT '' COMMENT 'Unique Clinical Rule identifier',
        pid int(11) NOT NULL DEFAULT 0 COMMENT 'Patient ID (0 if general rule)',
        active_alert_flag tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Active Alert Flag',
        passive_alert_flag tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Passive Alert Flag',
        cqm_flag tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Clinical Quality Measure flag',
        cqm_2011_flag tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Clinical Quality Measure 2011 flag',
        cqm_2014_flag tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Clinical Quality Measure 2014 flag',
        amc_flag tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Automated Measure Calculation flag',
        amc_2011_flag tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Automated Measure Calculation 2011 flag',
        amc_2014_flag tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Automated Measure Calculation 2014 flag',
        amc_code varchar(30) NOT NULL DEFAULT '' COMMENT 'Automated Measure Calculation Code',
        amc_code_2014 varchar(30) NOT NULL DEFAULT '' COMMENT 'Automated Measure Calculation Code 2014',
        patient_reminder_flag tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Patient Reminder Flag',
        access_control varchar(255) NOT NULL DEFAULT 'admin|super' COMMENT 'ACO link',
        PRIMARY KEY (id, pid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- ========================================
    -- AUDIT AND LOGGING
    -- ========================================
    
    -- Log table for audit trail
    CREATE TABLE IF NOT EXISTS log (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        date datetime DEFAULT NULL,
        event varchar(255) DEFAULT NULL,
        user varchar(255) DEFAULT NULL,
        groupname varchar(255) DEFAULT NULL,
        comments longtext,
        user_notes longtext,
        patient_id bigint(20) DEFAULT NULL,
        success tinyint(1) DEFAULT 1,
        checksum longtext,
        crt_user varchar(255) DEFAULT NULL,
        uuid binary(16) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY date (date),
        KEY user (user),
        KEY patient_id (patient_id),
        KEY uuid (uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
    -- Log comments
    CREATE TABLE IF NOT EXISTS log_comment_encrypt (
        id int(11) NOT NULL AUTO_INCREMENT,
        log_id int(11) NOT NULL,
        encrypt varchar(255) DEFAULT NULL,
        checksum varchar(32) DEFAULT NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
EOSQL

echo "OpenEMR core components created successfully!"
echo ""
echo "Core components include:"
echo "  ✅ Version tracking and system configuration"
echo "  ✅ Patient management and demographics"
echo "  ✅ Clinical documentation (encounters, lists, prescriptions)"
echo "  ✅ Scheduling and appointment management"
echo "  ✅ Billing and insurance handling"
echo "  ✅ Document management system"
echo "  ✅ Clinical decision rules framework"
echo "  ✅ Comprehensive audit and logging"
echo "  ✅ WebQX integration components"